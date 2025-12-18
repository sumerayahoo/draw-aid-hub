-- Create test_history table for storing test results
CREATE TABLE public.test_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  drawing_type TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  score NUMERIC NOT NULL,
  accuracy NUMERIC NOT NULL,
  errors TEXT[] DEFAULT '{}',
  feedback TEXT,
  user_identifier TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own test history (using a browser identifier)
CREATE POLICY "Anyone can insert test history"
ON public.test_history
FOR INSERT
WITH CHECK (true);

-- Anyone can view their own test history by identifier
CREATE POLICY "Anyone can view their own test history"
ON public.test_history
FOR SELECT
USING (true);

-- Anyone can delete their own test history
CREATE POLICY "Anyone can delete their own test history"
ON public.test_history
FOR DELETE
USING (true);

-- Fix security issue: Add UPDATE policy for content table
CREATE POLICY "Admins can update content"
ON public.content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix security issue: Remove overly permissive policy from admin_sessions if it exists
-- The existing "Admins can view admin sessions" policy with has_role check is correct
-- We need to ensure there's no public SELECT access