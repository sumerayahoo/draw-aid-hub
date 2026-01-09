import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for password
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

function generateResetToken(): string {
  const array = new Uint8Array(16);
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

    const { action, email, password, branch, sessionToken, newPassword, resetToken, profile } = await req.json();

    const validBranches = ['computer_engineering', 'cst', 'data_science', 'ai', 'ece'];

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
          points: 0,
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
        .select('email, branch, full_name, avatar_url, interests, goals, extra_info, points')
        .eq('email', session.student_email)
        .single();

      return new Response(
        JSON.stringify({ 
          valid: true,
          email: student?.email,
          branch: student?.branch,
          fullName: student?.full_name,
          avatarUrl: student?.avatar_url,
          interests: student?.interests,
          goals: student?.goals,
          extraInfo: student?.extra_info,
          points: student?.points || 0,
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

    if (action === 'request_reset') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if student exists
      const { data: student } = await supabase
        .from('students')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      if (!student) {
        // Return success even if not found to prevent email enumeration
        return new Response(
          JSON.stringify({ success: true, message: 'If the email exists, a reset token has been generated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate reset token
      const token = generateResetToken();
      await supabase
        .from('student_password_reset_tokens')
        .insert({
          student_email: email.toLowerCase(),
          token: token,
        });

      // In a real app, you'd send this via email. For now, return the token.
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Reset token generated',
          resetToken: token // In production, this would be sent via email
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reset_password') {
      if (!resetToken || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'Reset token and new password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find valid reset token
      const { data: tokenData, error: tokenError } = await supabase
        .from('student_password_reset_tokens')
        .select('*')
        .eq('token', resetToken)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired reset token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update password
      const newPasswordHash = await hashPassword(newPassword);
      await supabase
        .from('students')
        .update({ password_hash: newPasswordHash })
        .eq('email', tokenData.student_email);

      // Mark token as used
      await supabase
        .from('student_password_reset_tokens')
        .update({ used: true })
        .eq('id', tokenData.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_profile') {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify session
      const { data: session } = await supabase
        .from('student_sessions')
        .select('student_email')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: Record<string, string> = {};
      if (profile.fullName !== undefined) updateData.full_name = profile.fullName;
      if (profile.avatarUrl !== undefined) updateData.avatar_url = profile.avatarUrl;
      if (profile.interests !== undefined) updateData.interests = profile.interests;
      if (profile.goals !== undefined) updateData.goals = profile.goals;
      if (profile.extraInfo !== undefined) updateData.extra_info = profile.extraInfo;
      if (profile.branch !== undefined && validBranches.includes(profile.branch)) {
        updateData.branch = profile.branch;
      }

      const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('email', session.student_email);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_profile') {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify session
      const { data: session } = await supabase
        .from('student_sessions')
        .select('student_email')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('email', session.student_email)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true,
          profile: {
            email: student?.email,
            branch: student?.branch,
            fullName: student?.full_name,
            avatarUrl: student?.avatar_url,
            interests: student?.interests,
            goals: student?.goals,
            extraInfo: student?.extra_info,
            points: student?.points || 0,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_attendance') {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify session
      const { data: session } = await supabase
        .from('student_sessions')
        .select('student_email')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_email', session.student_email)
        .order('date', { ascending: false });

      return new Response(
        JSON.stringify({ success: true, attendance: attendance || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add_points') {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { score } = await req.json();
      
      // Verify session
      const { data: session } = await supabase
        .from('student_sessions')
        .select('student_email')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate points based on score
      let pointsToAdd = 0;
      if (score >= 9) {
        pointsToAdd = 10;
      } else if (score >= 7) {
        pointsToAdd = 8;
      } else if (score > 6) {
        pointsToAdd = 5;
      }

      if (pointsToAdd > 0) {
        // Get current points
        const { data: student } = await supabase
          .from('students')
          .select('points')
          .eq('email', session.student_email)
          .single();

        const newPoints = (student?.points || 0) + pointsToAdd;
        
        await supabase
          .from('students')
          .update({ points: newPoints })
          .eq('email', session.student_email);

        return new Response(
          JSON.stringify({ success: true, pointsAdded: pointsToAdd, totalPoints: newPoints }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, pointsAdded: 0 }),
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