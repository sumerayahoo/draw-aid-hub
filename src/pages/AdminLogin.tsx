import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

const ADMIN_PASSWORD = "772855";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const adminSession = localStorage.getItem("admin_session");
      if (adminSession === "active") {
        navigate('/admin');
        return;
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
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem("admin_session", "active");
        toast.success("Logged in as admin!");
        navigate('/admin');
      } else {
        toast.error("Invalid password");
      }
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
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-mono text-2xl">Admin Login</CardTitle>
                <CardDescription>
                  Enter the admin password to access the panel
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
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
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;