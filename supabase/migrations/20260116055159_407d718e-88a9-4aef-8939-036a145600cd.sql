-- Create a table to store admin settings including the password
CREATE TABLE public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default password
INSERT INTO public.admin_settings (id, password_hash) VALUES ('main', '772855');

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- No public access - only edge functions with service role can access