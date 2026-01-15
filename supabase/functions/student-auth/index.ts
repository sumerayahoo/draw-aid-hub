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

    const body = await req.json();
    const { action, email, password, branch, username, sessionToken, newPassword, resetToken, profile, score, rollNo } = body;

    const validBranches = ['computer_engineering', 'cst', 'data_science', 'ai', 'ece'];

    if (action === 'register') {
      if (!email || !password || !branch || !username) {
        return new Response(
          JSON.stringify({ error: 'Email, password, username, and branch are required' }),
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

      // Validate username (alphanumeric, 3-20 chars)
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return new Response(
          JSON.stringify({ error: 'Username must be 3-20 characters (letters, numbers, underscore only)' }),
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

      // Validate roll number if provided
      if (rollNo !== undefined && rollNo !== null && rollNo !== '') {
        const rollNoNum = Number(rollNo);
        if (isNaN(rollNoNum) || rollNoNum <= 0 || !Number.isInteger(rollNoNum)) {
          return new Response(
            JSON.stringify({ error: 'Roll number must be a positive integer' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('students')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingEmail) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if username already exists
      const { data: existingUsername } = await supabase
        .from('students')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUsername) {
        return new Response(
          JSON.stringify({ error: 'Username already taken' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const passwordHash = await hashPassword(password);

      const insertData: Record<string, any> = {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password_hash: passwordHash,
        branch: branch,
        points: 0,
      };

      if (rollNo !== undefined && rollNo !== null && rollNo !== '') {
        insertData.roll_no = Number(rollNo);
      }

      const { error: insertError } = await supabase
        .from('students')
        .insert(insertData);

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
          username: username.toLowerCase(),
          branch: branch 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      if (!password || (!email && !username)) {
        return new Response(
          JSON.stringify({ error: 'Email/Username and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const passwordHash = await hashPassword(password);

      // Try login with email or username
      let query = supabase
        .from('students')
        .select('id, email, username, branch, full_name, avatar_url, interests, goals, extra_info, points, roll_no, login_locked')
        .eq('password_hash', passwordHash);

      if (email) {
        query = query.eq('email', email.toLowerCase());
      } else if (username) {
        query = query.eq('username', username.toLowerCase());
      }

      const { data: student, error: fetchError } = await query.single();

      if (fetchError || !student) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if student is locked by admin
      if (student.login_locked) {
        return new Response(
          JSON.stringify({ error: 'Your account is locked. Please contact admin to re-enable login.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          username: student.username,
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

      // Get student details (excluding password_hash)
      const { data: student } = await supabase
        .from('students')
        .select('email, username, branch, full_name, avatar_url, interests, goals, extra_info, points, roll_no')
        .eq('email', session.student_email)
        .single();

      return new Response(
        JSON.stringify({ 
          valid: true,
          email: student?.email,
          username: student?.username,
          branch: student?.branch,
          fullName: student?.full_name,
          avatarUrl: student?.avatar_url,
          interests: student?.interests,
          goals: student?.goals,
          extraInfo: student?.extra_info,
          points: student?.points || 0,
          rollNo: student?.roll_no,
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

      const updateData: Record<string, any> = {};
      if (profile.fullName !== undefined) updateData.full_name = profile.fullName;
      if (profile.avatarUrl !== undefined) updateData.avatar_url = profile.avatarUrl;
      if (profile.interests !== undefined) updateData.interests = profile.interests;
      if (profile.goals !== undefined) updateData.goals = profile.goals;
      if (profile.extraInfo !== undefined) updateData.extra_info = profile.extraInfo;
      if (profile.branch !== undefined && validBranches.includes(profile.branch)) {
        updateData.branch = profile.branch;
      }
      if (profile.rollNo !== undefined) {
        if (profile.rollNo === null || profile.rollNo === '') {
          updateData.roll_no = null;
        } else {
          const rollNoNum = Number(profile.rollNo);
          if (!isNaN(rollNoNum) && rollNoNum > 0 && Number.isInteger(rollNoNum)) {
            updateData.roll_no = rollNoNum;
          }
        }
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

      // Exclude password_hash from response
      const { data: student } = await supabase
        .from('students')
        .select('email, username, branch, full_name, avatar_url, interests, goals, extra_info, points, roll_no')
        .eq('email', session.student_email)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true,
          profile: {
            email: student?.email,
            username: student?.username,
            branch: student?.branch,
            fullName: student?.full_name,
            avatarUrl: student?.avatar_url,
            interests: student?.interests,
            goals: student?.goals,
            extraInfo: student?.extra_info,
            points: student?.points || 0,
            rollNo: student?.roll_no,
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

      // Filter out admin email from response for security
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id, date, branch, marked_at')
        .eq('student_email', session.student_email)
        .order('date', { ascending: false });

      return new Response(
        JSON.stringify({ success: true, attendance: attendance || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add_points') {
      if (!sessionToken || score === undefined) {
        return new Response(
          JSON.stringify({ error: 'Session token and score are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      // Calculate points based on score
      let pointsToAdd = 0;
      if (score >= 9) pointsToAdd = 10;
      else if (score >= 8) pointsToAdd = 8;
      else if (score >= 7) pointsToAdd = 5;
      else if (score > 6) pointsToAdd = 3;

      if (pointsToAdd > 0) {
        // Get current points
        const { data: student } = await supabase
          .from('students')
          .select('points')
          .eq('email', session.student_email)
          .single();

        const currentPoints = student?.points || 0;
        const newPoints = currentPoints + pointsToAdd;

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
        JSON.stringify({ success: true, pointsAdded: 0, message: 'Score too low to earn points' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_logged_in_students') {
      // This is for admin use - get students with active sessions grouped by branch
      const { data: activeSessions } = await supabase
        .from('student_sessions')
        .select('student_email')
        .gt('expires_at', new Date().toISOString());

      if (!activeSessions || activeSessions.length === 0) {
        return new Response(
          JSON.stringify({ success: true, students: {} }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const emails = [...new Set(activeSessions.map(s => s.student_email))];

      // Get student details (excluding password_hash)
      const { data: students } = await supabase
        .from('students')
        .select('email, username, branch, full_name, avatar_url, last_login, points, roll_no')
        .in('email', emails);

      // Group by branch
      const groupedByBranch: Record<string, any[]> = {};
      students?.forEach(student => {
        if (!groupedByBranch[student.branch]) {
          groupedByBranch[student.branch] = [];
        }
        groupedByBranch[student.branch].push({
          email: student.email,
          username: student.username,
          fullName: student.full_name,
          avatarUrl: student.avatar_url,
          lastLogin: student.last_login,
          points: student.points || 0,
          rollNo: student.roll_no,
        });
      });

      return new Response(
        JSON.stringify({ success: true, students: groupedByBranch }),
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
