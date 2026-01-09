import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Loader2, Mail, Lock, Building2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  branch: z.enum(["computer_engineering", "cst", "data_science", "ai", "ece"], {
    required_error: "Please select a branch",
  }),
});

const branches = [
  { value: "computer_engineering", label: "Computer Engineering" },
  { value: "cst", label: "Computer Science and Technology" },
  { value: "data_science", label: "Data Science" },
  { value: "ai", label: "Artificial Intelligence" },
  { value: "ece", label: "Electronics and Communication" },
];

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionToken = localStorage.getItem("student_session_token");
      if (!sessionToken) {
        setCheckingSession(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "verify", sessionToken },
      });

      if (data?.valid) {
        localStorage.setItem("student_email", data.email);
        localStorage.setItem("student_branch", data.branch);
        navigate("/student-dashboard");
      } else {
        localStorage.removeItem("student_session_token");
        localStorage.removeItem("student_email");
        localStorage.removeItem("student_branch");
      }
    } catch (error) {
      console.error("Session verification error:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "login", email, password },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      localStorage.setItem("student_session_token", data.sessionToken);
      localStorage.setItem("student_email", data.email);
      localStorage.setItem("student_branch", data.branch);

      toast.success("Logged in successfully!");
      navigate("/student-dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      registerSchema.parse({ email, password, branch });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "register", email, password, branch },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      localStorage.setItem("student_session_token", data.sessionToken);
      localStorage.setItem("student_email", data.email);
      localStorage.setItem("student_branch", data.branch);

      toast.success("Registration successful!");
      navigate("/student-dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "request_reset", email: resetEmail },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success("Reset token generated! Check below.");
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setShowResetForm(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to request reset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword.trim()) {
      toast.error("Please enter reset token and new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "reset_password", resetToken, newPassword },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success("Password reset successfully! Please login.");
      setShowForgotPassword(false);
      setShowResetForm(false);
      setResetToken("");
      setNewPassword("");
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 blueprint-dots opacity-20" />
        
        <div className="relative container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="border-border/50 shadow-card">
              <CardHeader className="text-center">
                <div className="mx-auto p-3 rounded-xl bg-secondary/10 w-fit mb-4">
                  {showForgotPassword ? (
                    <KeyRound className="w-8 h-8 text-secondary" />
                  ) : (
                    <GraduationCap className="w-8 h-8 text-secondary" />
                  )}
                </div>
                <CardTitle className="font-mono text-2xl">
                  {showForgotPassword ? "Reset Password" : "Student Portal"}
                </CardTitle>
                <CardDescription>
                  {showForgotPassword 
                    ? "Enter your email to reset your password"
                    : "Access learning resources for your branch"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {showForgotPassword ? (
                  <div className="space-y-4">
                    {!showResetForm ? (
                      <form onSubmit={handleRequestReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="student@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="gradient"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Requesting...
                            </>
                          ) : (
                            "Request Reset Token"
                          )}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-token">Reset Token</Label>
                          <Input
                            id="reset-token"
                            type="text"
                            placeholder="Enter reset token"
                            value={resetToken}
                            onChange={(e) => setResetToken(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            New Password
                          </Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="gradient"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Resetting...
                            </>
                          ) : (
                            "Reset Password"
                          )}
                        </Button>
                      </form>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setShowResetForm(false);
                      }}
                    >
                      Back to Login
                    </Button>
                  </div>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password
                          </Label>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="gradient"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Logging in...
                            </>
                          ) : (
                            "Login"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="w-full text-muted-foreground"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot Password?
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password" className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password
                          </Label>
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum 6 characters
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Branch
                          </Label>
                          <Select value={branch} onValueChange={setBranch} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your branch" />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                  {b.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="submit"
                          variant="gradient"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Registering...
                            </>
                          ) : (
                            "Register"
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;