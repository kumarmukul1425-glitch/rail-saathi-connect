
-- Allow authenticated users to insert trains (needed for booking flow to sync local data)
CREATE POLICY "Authenticated users can insert trains" ON public.trains 
  FOR INSERT TO authenticated 
  WITH CHECK (true);
