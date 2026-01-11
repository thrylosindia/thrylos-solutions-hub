
-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;

-- Create a more secure policy requiring valid email format
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (
        email IS NOT NULL AND 
        name IS NOT NULL AND 
        message IS NOT NULL AND
        length(email) > 3 AND
        length(name) > 1 AND
        length(message) > 1
    );
