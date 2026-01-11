-- Add RLS policy for admin to delete service_requests
CREATE POLICY "Admins can delete requests"
ON public.service_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));