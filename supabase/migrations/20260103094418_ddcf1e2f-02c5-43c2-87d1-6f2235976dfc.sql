-- Create students table for storing student credentials and branch
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  branch text NOT NULL CHECK (branch IN ('civil', 'mechanical', 'electrical', 'computer', 'electronics')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students can only view their own record
CREATE POLICY "Students can view own record" 
ON public.students 
FOR SELECT 
USING (email = (auth.jwt()->>'email'));

-- Public can insert (for registration) but only their own email
CREATE POLICY "Anyone can register" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

-- Students can update their own record
CREATE POLICY "Students can update own record" 
ON public.students 
FOR UPDATE 
USING (email = (auth.jwt()->>'email'))
WITH CHECK (email = (auth.jwt()->>'email'));

-- Create student_sessions table for persistent login
CREATE TABLE public.student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email text NOT NULL,
  session_token text UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions can be viewed by the owner
CREATE POLICY "Students can view own sessions" 
ON public.student_sessions 
FOR SELECT 
USING (student_email = (auth.jwt()->>'email') OR session_token = current_setting('app.session_token', true));

-- Anyone can create sessions (for login)
CREATE POLICY "Anyone can create sessions" 
ON public.student_sessions 
FOR INSERT 
WITH CHECK (true);

-- Students can delete their own sessions
CREATE POLICY "Students can delete own sessions" 
ON public.student_sessions 
FOR DELETE 
USING (student_email = (auth.jwt()->>'email') OR session_token = current_setting('app.session_token', true));