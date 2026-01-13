import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_ADMIN_PASSWORD = "772855";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      action,
      password,
      adminToken,
      // attendance
      branch,
      monthStart,
      monthEnd,
      date,
      studentEmail,
      // content
      contentItem,
      contentId,
    } = body;

    const requireAdmin = async () => {
      if (!adminToken) {
        return { ok: false as const, response: new Response(JSON.stringify({ error: "Admin token required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
      }

      const { data: session } = await supabase
        .from("admin_sessions")
        .select("id, expires_at")
        .eq("id", adminToken)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return { ok: false as const, response: new Response(JSON.stringify({ error: "Invalid or expired admin session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
      }

      return { ok: true as const };
    };

    if (action === "login") {
      const expected = Deno.env.get("ADMIN_PASSWORD") || DEFAULT_ADMIN_PASSWORD;
      if (!password || password !== expected) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create a session row; use its UUID id as the token.
      const expiresAt = addDays(new Date(), 7).toISOString();
      const { data, error } = await supabase
        .from("admin_sessions")
        .insert({ user_email: "admin", expires_at: expiresAt })
        .select("id, expires_at")
        .single();

      if (error || !data) {
        console.error("admin login insert error:", error);
        return new Response(JSON.stringify({ error: "Failed to create admin session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, adminToken: data.id, expiresAt: data.expires_at }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;
      return new Response(JSON.stringify({ valid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_students_by_branch") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;

      if (!branch) {
        return new Response(JSON.stringify({ error: "branch is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const normalizedBranches = branch === "computer_engineering" ? ["computer_engineering", "computer"] : [branch];

      const { data, error } = await supabase
        .from("students")
        .select("email, branch, full_name, username, roll_no")
        .in("branch", normalizedBranches)
        .order("roll_no", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("get_students_by_branch error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch students" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, students: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_attendance_by_branch_month") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;

      if (!branch || !monthStart || !monthEnd) {
        return new Response(JSON.stringify({ error: "branch, monthStart, monthEnd are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_email, date")
        .eq("branch", branch)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      if (error) {
        console.error("get_attendance_by_branch_month error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch attendance" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, attendance: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "mark_attendance") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;

      if (!branch || !date || !studentEmail) {
        return new Response(JSON.stringify({ error: "branch, date, studentEmail are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("attendance")
        .insert({ branch, date, student_email: String(studentEmail).toLowerCase(), marked_by: "admin" });

      if (error) {
        // 23505: unique violation if there's a unique constraint
        const code = (error as any).code;
        if (code === "23505") {
          return new Response(JSON.stringify({ error: "Attendance already marked for this date" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.error("mark_attendance error:", error);
        return new Response(JSON.stringify({ error: "Failed to mark attendance" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unmark_attendance") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;

      if (!branch || !date || !studentEmail) {
        return new Response(JSON.stringify({ error: "branch, date, studentEmail are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("branch", branch)
        .eq("date", date)
        .eq("student_email", String(studentEmail).toLowerCase());

      if (error) {
        console.error("unmark_attendance error:", error);
        return new Response(JSON.stringify({ error: "Failed to remove attendance" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove_student_session") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;

      if (!studentEmail) {
        return new Response(JSON.stringify({ error: "studentEmail is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("student_sessions")
        .delete()
        .eq("student_email", String(studentEmail).toLowerCase());

      if (error) {
        console.error("remove_student_session error:", error);
        return new Response(JSON.stringify({ error: "Failed to remove student session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "insert_content") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;

      if (!contentItem) {
        return new Response(JSON.stringify({ error: "contentItem is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { semester, drawing_type, content_type, title, file_url } = contentItem;
      if (!semester || !drawing_type || !content_type || !title) {
        return new Response(JSON.stringify({ error: "semester, drawing_type, content_type, title are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("content")
        .insert({ semester, drawing_type, content_type, title, file_url: file_url ?? null })
        .select("id")
        .single();

      if (error) {
        console.error("insert_content error:", error);
        return new Response(JSON.stringify({ error: "Failed to add content" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, id: data?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_content") {
      const check = await requireAdmin();
      if (!check.ok) return check.response;

      if (!contentId) {
        return new Response(JSON.stringify({ error: "contentId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("content").delete().eq("id", contentId);
      if (error) {
        console.error("delete_content error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete content" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-api error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
