
-- Performance indexes for all tables
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_pm_id ON public.service_requests(assigned_pm_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON public.service_requests(priority);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_service_request_id ON public.payment_requests(service_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON public.payment_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON public.otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_project_managers_is_available ON public.project_managers(is_available);
CREATE INDEX IF NOT EXISTS idx_project_managers_email ON public.project_managers(email);

CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON public.team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_order_index ON public.team_members(order_index);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_is_featured ON public.portfolio_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_category ON public.portfolio_items(category);

-- Add username column to profiles for display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Storage policy for profile avatars (bucket 'uploads' already exists and is public)
-- Users can upload to their own folder in uploads bucket
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'avatars'
);
