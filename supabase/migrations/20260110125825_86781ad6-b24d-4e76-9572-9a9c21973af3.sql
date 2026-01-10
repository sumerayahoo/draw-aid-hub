-- Add username column to students table
ALTER TABLE public.students 
ADD COLUMN username text UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_students_username ON public.students(username);

-- Add RLS policy for admins to view all students (for the admin panel)
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix the password_reset_tokens table - add service-role level policies
-- These will be used by the edge function with service role key
CREATE POLICY "Service can select reset tokens"
ON public.student_password_reset_tokens
FOR SELECT
USING (true);

CREATE POLICY "Service can update reset tokens"
ON public.student_password_reset_tokens
FOR UPDATE
USING (true);

CREATE POLICY "Service can delete reset tokens"
ON public.student_password_reset_tokens
FOR DELETE
USING (true);