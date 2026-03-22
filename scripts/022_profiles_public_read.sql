-- =============================================
-- 022: Fix profiles RLS - allow public read
-- (consistent with all other tables in this project)
-- =============================================

-- Drop the restrictive policy that requires auth.uid() match
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Allow anyone to read profiles (only role data, not sensitive)
CREATE POLICY "Public read profiles"
  ON public.profiles FOR SELECT
  USING (true);
