import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for password (in production, use bcrypt via edge function)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "student_salt_772855");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, password, branch, sessionToken } = await req.json();

    if (action === 'register') {
      if (!email || !password || !branch) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and branch are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate password (min 6 characters)
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate branch
      const validBranches = ['civil', 'mechanical', 'electrical', 'computer', 'electronics'];
      if (!validBranches.includes(branch)) {
        return new Response(
          JSON.stringify({ error: 'Invalid branch selected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingStudent) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const passwordHash = await hashPassword(password);

      const { error: insertError } = await supabase
        .from('students')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          branch: branch,
        });

      if (insertError) {
        console.error('Registration error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to register' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create session
      const newSessionToken = generateSessionToken();
      await supabase
        .from('student_sessions')
        .insert({
          student_email: email.toLowerCase(),
          session_token: newSessionToken,
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration successful',
          sessionToken: newSessionToken,
          email: email.toLowerCase(),
          branch: branch 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const passwordHash = await hashPassword(password);

      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password_hash', passwordHash)
        .single();

      if (fetchError || !student) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last login
      await supabase
        .from('students')
        .update({ last_login: new Date().toISOString() })
        .eq('id', student.id);

      // Create new session
      const newSessionToken = generateSessionToken();
      await supabase
        .from('student_sessions')
        .insert({
          student_email: student.email,
          session_token: newSessionToken,
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          sessionToken: newSessionToken,
          email: student.email,
          branch: student.branch 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Session token required', valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session, error: sessionError } = await supabase
        .from('student_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get student details
      const { data: student } = await supabase
        .from('students')
        .select('email, branch')
        .eq('email', session.student_email)
        .single();

      return new Response(
        JSON.stringify({ 
          valid: true,
          email: student?.email,
          branch: student?.branch 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'logout') {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('student_sessions')
        .delete()
        .eq('session_token', sessionToken);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});