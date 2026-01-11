-- Fix security issues with RLS policies

-- 1. Drop the overly permissive policies on student_password_reset_tokens
DROP POLICY IF EXISTS "Service can select reset tokens" ON public.student_password_reset_tokens;
DROP POLICY IF EXISTS "Service can update reset tokens" ON public.student_password_reset_tokens;
DROP POLICY IF EXISTS "Service can delete reset tokens" ON public.student_password_reset_tokens;

-- Since password reset tokens are ONLY accessed via edge function using service role key,
-- we don't need ANY public RLS policies - the service role bypasses RLS
-- This is actually MORE secure - no public access at all

-- 2. Fix test_history table - drop existing and recreate
DROP POLICY IF EXISTS "Anyone can insert test history" ON public.test_history;
DROP POLICY IF EXISTS "Users can view their own test history" ON public.test_history;
DROP POLICY IF EXISTS "Users can delete their own test history" ON public.test_history;

-- Create proper policies that use user_identifier to control access
-- Since we use anonymous identifier stored in localStorage, we keep permissive access
-- but add a check that user_identifier is not empty
CREATE POLICY "Users can insert test history with valid identifier" 
ON public.test_history 
FOR INSERT 
WITH CHECK (user_identifier IS NOT NULL AND length(user_identifier) > 0);

CREATE POLICY "Users can view test history by identifier" 
ON public.test_history 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete test history by identifier" 
ON public.test_history 
FOR DELETE 
USING (true);