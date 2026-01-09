-- First, drop the existing branch constraint
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_branch_check;

-- Add profile fields to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT,
ADD COLUMN IF NOT EXISTS extra_info TEXT,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  branch TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marked_by TEXT NOT NULL,
  UNIQUE(student_email, date)
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "Admins can view all attendance" 
ON public.attendance 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can mark attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update attendance" 
ON public.attendance 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete attendance" 
ON public.attendance 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own attendance" 
ON public.attendance 
FOR SELECT 
USING (student_email = current_setting('app.student_email', true));

-- Create password_reset_tokens table for student password reset
CREATE TABLE IF NOT EXISTS public.student_password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can create reset tokens (via edge function)
CREATE POLICY "Anyone can create reset tokens" 
ON public.student_password_reset_tokens 
FOR INSERT 
WITH CHECK (true);

-- Add new branch constraint with updated values
ALTER TABLE public.students 
ADD CONSTRAINT students_branch_check 
CHECK (branch IN ('computer_engineering', 'cst', 'data_science', 'ai', 'ece', 'civil', 'mechanical', 'electrical', 'computer', 'electronics'));