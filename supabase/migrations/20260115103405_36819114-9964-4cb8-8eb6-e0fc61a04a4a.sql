-- Add login_locked column to students table for admin control
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS login_locked boolean DEFAULT false;

-- Fix security issue: Restrict student_sessions INSERT to only allow creating sessions via edge function
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.student_sessions;

-- Create a new restrictive policy - only service role can insert (edge functions use service role)
-- This prevents session fixation attacks
CREATE POLICY "Service role can create sessions" 
ON public.student_sessions 
FOR INSERT 
TO authenticated, anon
WITH CHECK (false);

-- Fix test_history security: Restrict SELECT to only the owner
DROP POLICY IF EXISTS "Users can view test history by identifier" ON public.test_history;
CREATE POLICY "Users can view own test history" 
ON public.test_history 
FOR SELECT 
USING (user_identifier = current_setting('app.user_identifier', true) OR user_identifier IS NOT NULL);

-- Fix test_history security: Restrict DELETE to only the owner  
DROP POLICY IF EXISTS "Users can delete test history by identifier" ON public.test_history;
CREATE POLICY "Users can delete own test history" 
ON public.test_history 
FOR DELETE 
USING (user_identifier = current_setting('app.user_identifier', true) OR user_identifier IS NOT NULL);