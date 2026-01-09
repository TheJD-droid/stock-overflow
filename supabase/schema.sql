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