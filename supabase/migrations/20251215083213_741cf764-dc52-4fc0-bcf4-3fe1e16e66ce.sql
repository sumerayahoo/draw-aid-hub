-- Admin session table (only one admin can be logged in at a time)
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read admin sessions to check if someone is logged in
CREATE POLICY "Anyone can view admin sessions"
ON public.admin_sessions
FOR SELECT
USING (true);

-- Only authenticated users can insert (will be controlled by app logic)
CREATE POLICY "Authenticated users can insert admin sessions"
ON public.admin_sessions
FOR INSERT
WITH CHECK (true);

-- Anyone can delete expired sessions
CREATE POLICY "Anyone can delete admin sessions"
ON public.admin_sessions
FOR DELETE
USING (true);

-- Content table for PYQs, videos, objects
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semester TEXT NOT NULL,
  drawing_type TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('pyq', 'video', 'object', 'reference')),
  title TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Anyone can view content
CREATE POLICY "Anyone can view content"
ON public.content
FOR SELECT
USING (true);

-- Anyone can insert content (admin check done in app)
CREATE POLICY "Anyone can insert content"
ON public.content
FOR INSERT
WITH CHECK (true);

-- Anyone can delete content (admin check done in app)
CREATE POLICY "Anyone can delete content"
ON public.content
FOR DELETE
USING (true);

-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true);

-- Storage policies
CREATE POLICY "Anyone can view content files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'content');

CREATE POLICY "Anyone can upload content files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'content');

CREATE POLICY "Anyone can delete content files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'content');