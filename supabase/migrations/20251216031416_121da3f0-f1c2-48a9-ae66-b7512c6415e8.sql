-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles: only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing insecure policies on admin_sessions
DROP POLICY IF EXISTS "Anyone can delete admin sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Anyone can view admin sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert admin sessions" ON public.admin_sessions;

-- Create secure policies for admin_sessions
CREATE POLICY "Admins can view admin sessions"
ON public.admin_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin sessions"
ON public.admin_sessions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete own sessions"
ON public.admin_sessions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing insecure policies on content
DROP POLICY IF EXISTS "Anyone can delete content" ON public.content;
DROP POLICY IF EXISTS "Anyone can insert content" ON public.content;

-- Create secure policies for content
CREATE POLICY "Admins can insert content"
ON public.content
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content"
ON public.content
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep public read access for content (educational platform)
-- "Anyone can view content" policy already exists