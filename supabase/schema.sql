-- Clean up existing triggers and functions first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS household_members;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS households;

-- 1. HOUSEHOLDS: The primary containers
CREATE TABLE households (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  room_code text UNIQUE DEFAULT upper(substring(md5(random()::text), 0, 7)),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. PROFILES: User display identities
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. HOUSEHOLD_MEMBERS: Connecting Profiles to Households
CREATE TABLE household_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', 
  user_color text,
  role text DEFAULT 'member',
  UNIQUE(user_id, household_id)
);

-- 4. ITEMS: The inventory list
CREATE TABLE items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'General',
  current_qty float DEFAULT 0,
  threshold float DEFAULT 1,
  last_updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. AUTOMATION: Create profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', 'New Member')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

---
--- ROW LEVEL SECURITY (RLS) POLICIES
---

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- PROFILES: Everyone can see names, but only you can edit yours
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- HOUSEHOLDS: Allow creation, but restrict viewing to members
CREATE POLICY "Users can create households" ON households FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own households" ON households FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_members.household_id = households.id 
    AND household_members.user_id = auth.uid()
  )
);

-- HOUSEHOLD_MEMBERS: Users manage their own memberships; can see housemates
CREATE POLICY "Members can view other members in the same household" ON household_members FOR SELECT
USING (
  household_id IN (
    SELECT hm.household_id FROM household_members hm WHERE hm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join a household" ON household_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave a household" ON household_members FOR DELETE USING (auth.uid() = user_id);

-- ITEMS: Strict household-based CRUD access
CREATE POLICY "Users can view items in their own household" ON items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_members.household_id = items.household_id 
    AND household_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert items into their own household" ON items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_members.household_id = items.household_id 
    AND household_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items in their own household" ON items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_members.household_id = items.household_id 
    AND household_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items in their own household" ON items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_members.household_id = items.household_id 
    AND household_members.user_id = auth.uid()
  )
);