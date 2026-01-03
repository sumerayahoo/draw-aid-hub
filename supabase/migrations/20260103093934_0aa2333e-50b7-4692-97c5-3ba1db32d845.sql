-- Fix 1: Update admin_sessions SELECT policy to only allow admins to view their own sessions
DROP POLICY IF EXISTS "Admins can view admin sessions" ON public.admin_sessions;
CREATE POLICY "Admins can view own sessions only" 
ON public.admin_sessions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_email = (auth.jwt()->>'email')
);

-- Fix 2: Update test_history policies to properly filter by user_identifier
DROP POLICY IF EXISTS "Anyone can view their own test history" ON public.test_history;
CREATE POLICY "Users can view their own test history" 
ON public.test_history 
FOR SELECT 
USING (
  user_identifier = auth.uid()::text 
  OR user_identifier = (auth.jwt()->>'email')
);

DROP POLICY IF EXISTS "Anyone can delete their own test history" ON public.test_history;
CREATE POLICY "Users can delete their own test history" 
ON public.test_history 
FOR DELETE 
USING (
  user_identifier = auth.uid()::text 
  OR user_identifier = (auth.jwt()->>'email')
);

-- Fix 3: Add comprehensive RLS policies for user_roles table (admin-only for all operations)
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));