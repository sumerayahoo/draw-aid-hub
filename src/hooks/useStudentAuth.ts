import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StudentSession {
  email: string;
  branch: string;
  isLoggedIn: boolean;
}

export const useStudentAuth = () => {
  const [session, setSession] = useState<StudentSession>({
    email: "",
    branch: "",
    isLoggedIn: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const verifySession = useCallback(async () => {
    const sessionToken = localStorage.getItem("student_session_token");
    
    if (!sessionToken) {
      setSession({ email: "", branch: "", isLoggedIn: false });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "verify", sessionToken },
      });

      if (data?.valid) {
        setSession({
          email: data.email,
          branch: data.branch,
          isLoggedIn: true,
        });
        localStorage.setItem("student_email", data.email);
        localStorage.setItem("student_branch", data.branch);
      } else {
        // Clear invalid session
        localStorage.removeItem("student_session_token");
        localStorage.removeItem("student_email");
        localStorage.removeItem("student_branch");
        setSession({ email: "", branch: "", isLoggedIn: false });
      }
    } catch (error) {
      console.error("Session verification error:", error);
      setSession({ email: "", branch: "", isLoggedIn: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const sessionToken = localStorage.getItem("student_session_token");
    
    try {
      await supabase.functions.invoke("student-auth", {
        body: { action: "logout", sessionToken },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("student_session_token");
    localStorage.removeItem("student_email");
    localStorage.removeItem("student_branch");
    setSession({ email: "", branch: "", isLoggedIn: false });
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  return {
    ...session,
    isLoading,
    logout,
    verifySession,
  };
};