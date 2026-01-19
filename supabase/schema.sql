-- ==========================================
-- 1. CLEANUP (Explicitly Drop Policies & Tables)
-- ==========================================

-- Drop Policies first
DROP POLICY IF EXISTS "Members can manage items" ON items;
DROP POLICY IF EXISTS "Members can view items" ON items;
DROP POLICY IF EXISTS "Users can leave a household" ON household_members;
DROP POLICY IF EXISTS "Users can add themselves to households" ON household_members;
DROP POLICY IF EXISTS "Members can view housemates" ON household_members;
DROP POLICY IF EXISTS "Authenticated users can create households" ON households;
DROP POLICY IF EXISTS "Households are discoverable by authenticated users" ON households;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Drop Triggers and Functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP FUNCTION IF EXISTS check_membership;

-- Drop Tables
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS household_members;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS profiles;

-- ==========================================
-- 2. EXTENSIONS & FUNCTIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper: Check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION check_membership(h_id uuid, u_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = h_id AND user_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automation: Create profile entry on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email, 'New User')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Remove any old version to avoid conflicts
DROP FUNCTION IF EXISTS public.update_item_quantity_atomic(uuid, uuid, integer, boolean);

-- 2. Create the fresh version
CREATE OR REPLACE FUNCTION public.update_item_quantity_atomic(
  target_item_id UUID,
  target_household_id UUID,
  new_value INTEGER,
  is_relative BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET quantity = CASE 
    WHEN is_relative THEN COALESCE(items.quantity, 0) + new_value 
    ELSE new_value 
  END,
  last_updated_by = auth.uid()
  WHERE id = target_item_id 
  AND household_id = target_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. TABLES
-- ==========================================
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name text,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE households (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  room_code text DEFAULT upper(substring(uuid_generate_v4()::text from 1 for 6)) UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE household_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(household_id, user_id)
);

CREATE TABLE items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quantity integer DEFAULT 1,
  category text,
  last_updated_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 4. TRIGGERS
-- ==========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 5. SECURITY (RLS)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Households are discoverable by authenticated users" 
ON households FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create households" 
ON households FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Members can view housemates" ON household_members FOR SELECT
USING (check_membership(household_id, auth.uid()));

CREATE POLICY "Users can add themselves to households" ON household_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave a household" ON household_members FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Members can view items" ON items FOR SELECT
USING (check_membership(household_id, auth.uid()));

CREATE POLICY "Members can manage items" ON items FOR ALL
USING (check_membership(household_id, auth.uid()))
WITH CHECK (check_membership(household_id, auth.uid()));