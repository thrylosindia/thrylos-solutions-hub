-- Add password field to project_managers for PM login
ALTER TABLE public.project_managers 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create storage policies for uploads bucket (allow anyone to upload/view)
-- First ensure the bucket policies exist

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  -- Try to drop existing policies
  BEGIN
    DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow admin delete" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

-- Create storage policies
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'uploads');

CREATE POLICY "Allow public update" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'uploads');

CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'uploads');

-- Add RLS for project managers to view their assigned requests
CREATE POLICY "PMs can view their assigned requests" 
  ON public.service_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.project_managers pm 
      WHERE pm.id = service_requests.assigned_pm_id 
      AND pm.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Allow PMs to update their assigned requests
CREATE POLICY "PMs can update their assigned requests"
  ON public.service_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_managers pm 
      WHERE pm.id = service_requests.assigned_pm_id 
      AND pm.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );