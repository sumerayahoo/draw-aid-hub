import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      // Clean up expired sessions first
      await supabase
        .from('admin_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Check if there's an active admin session
      const { data: sessions } = await supabase
        .from('admin_sessions')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (sessions && sessions.length > 0) {
        // Check if current user is the admin
        const currentEmail = localStorage.getItem('admin_email');
        if (currentEmail === sessions[0].user_email) {
          navigate('/admin');
        } else {
          setIsLocked(true);
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check for active admin session
      const { data: sessions } = await supabase
        .from('admin_sessions')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (sessions && sessions.length > 0) {
        toast.error("Admin portal is currently in use by another admin");
        setIsLocked(true);
        setIsLoading(false);
        return;
      }

      // Create new admin session
      const { error } = await supabase
        .from('admin_sessions')
        .insert({
          user_email: email,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      localStorage.setItem('admin_email', email);
      toast.success("Logged in as admin!");
      navigate('/admin');

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "Failed to login");
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
                <div className="mx-auto p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  {isLocked ? (
                    <Lock className="w-8 h-8 text-destructive" />
                  ) : (
                    <Shield className="w-8 h-8 text-primary" />
                  )}
                </div>
                <CardTitle className="font-mono text-2xl">
                  {isLocked ? "Admin Portal Locked" : "Admin Login"}
                </CardTitle>
                <CardDescription>
                  {isLocked 
                    ? "Another admin is currently using the portal. Please wait until they log out."
                    : "Enter your credentials to access the admin panel"
                  }
                </CardDescription>
              </CardHeader>
              
              {!isLocked && (
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
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
                        "Login to Admin Panel"
                      )}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
