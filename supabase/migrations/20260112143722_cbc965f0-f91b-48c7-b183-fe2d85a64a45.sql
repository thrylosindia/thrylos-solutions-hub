-- Create project_managers table
CREATE TABLE public.project_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  specialization TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_managers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage project managers
CREATE POLICY "Admins can manage project managers"
ON public.project_managers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view project managers (for user dashboard display)
CREATE POLICY "Anyone can view project managers"
ON public.project_managers
FOR SELECT
USING (true);

-- Add project manager assignment columns to service_requests
ALTER TABLE public.service_requests
ADD COLUMN assigned_pm_id UUID REFERENCES public.project_managers(id),
ADD COLUMN pm_assigned_at TIMESTAMP WITH TIME ZONE;

-- Create OTP verification table
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for OTP table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow public insert for OTP (needed for signup/login flow)
CREATE POLICY "Anyone can create OTP"
ON public.otp_verifications
FOR INSERT
WITH CHECK (true);

-- Allow public select/update for OTP verification
CREATE POLICY "Anyone can verify OTP"
ON public.otp_verifications
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update OTP"
ON public.otp_verifications
FOR UPDATE
USING (true);

-- Add realtime for service_requests updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_managers;

-- Create trigger for updating updated_at
CREATE TRIGGER update_project_managers_updated_at
BEFORE UPDATE ON public.project_managers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix portfolio RLS - allow admin insert without requiring admin to be logged in via normal auth
-- The admin-api edge function uses service role, so it bypasses RLS anyway
-- But we need to ensure regular inserts work too
DROP POLICY IF EXISTS "Admins can manage portfolio" ON public.portfolio_items;

CREATE POLICY "Admins can manage portfolio"
ON public.portfolio_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));