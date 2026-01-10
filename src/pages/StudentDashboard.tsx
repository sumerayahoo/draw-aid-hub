import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, BookOpen, Award, Calendar, Loader2, LogOut, 
  Star, Target, Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import StudentProfile from "@/components/StudentProfile";
import StudentAttendance from "@/components/StudentAttendance";

interface StudentData {
  email: string;
  username?: string;
  branch: string;
  fullName: string;
  avatarUrl: string;
  interests: string;
  goals: string;
  extraInfo: string;
  points: number;
}

const branches: Record<string, string> = {
  computer_engineering: "Computer Engineering",
  cst: "Computer Science and Technology",
  data_science: "Data Science",
  ai: "Artificial Intelligence",
  ece: "Electronics and Communication",
};

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    verifyAndFetchData();
  }, []);

  const verifyAndFetchData = async () => {
    const sessionToken = localStorage.getItem("student_session_token");
    
    if (!sessionToken) {
      navigate("/student-login");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "get_profile", sessionToken },
      });

      if (error || !data?.success) {
        throw new Error("Session expired");
      }

      setStudentData(data.profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      localStorage.removeItem("student_session_token");
      localStorage.removeItem("student_email");
      localStorage.removeItem("student_branch");
      localStorage.removeItem("student_username");
      navigate("/student-login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
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
    localStorage.removeItem("student_username");
    toast.success("Logged out successfully!");
    navigate("/student-login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 blueprint-dots opacity-20" />
        
        <div className="relative container mx-auto px-4 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={studentData.avatarUrl} alt="Avatar" />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                    {studentData.fullName?.[0] || studentData.username?.[0] || studentData.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-mono text-2xl font-bold">
                    {studentData.fullName || studentData.username || "Welcome, Student!"}
                  </h1>
                  {studentData.username && (
                    <p className="text-sm text-muted-foreground">@{studentData.username}</p>
                  )}
                  <p className="text-muted-foreground">
                    {branches[studentData.branch] || studentData.branch}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-mono font-bold">{studentData.points || 0} Points</span>
                </div>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-8">
                <TabsTrigger value="overview" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Attendance</span>
                </TabsTrigger>
                <TabsTrigger value="achievements" className="gap-2">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Points</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Quick Stats */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Total Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-mono font-bold">{studentData.points || 0}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Earn points by scoring well in AI tests
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Your Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {studentData.goals || "No goals set yet. Update your profile!"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-secondary" />
                        Interests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {studentData.interests || "No interests added yet. Update your profile!"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="md:col-span-2 lg:col-span-3 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                      <CardDescription>Jump to common tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col gap-2"
                          onClick={() => navigate("/")}
                        >
                          <BookOpen className="w-6 h-6" />
                          <span>Browse Content</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col gap-2"
                          onClick={() => setActiveTab("profile")}
                        >
                          <User className="w-6 h-6" />
                          <span>Edit Profile</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col gap-2"
                          onClick={() => setActiveTab("attendance")}
                        >
                          <Calendar className="w-6 h-6" />
                          <span>View Attendance</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col gap-2"
                          onClick={() => setActiveTab("achievements")}
                        >
                          <Award className="w-6 h-6" />
                          <span>View Points</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="profile">
                <StudentProfile 
                  studentData={studentData} 
                  onUpdate={verifyAndFetchData}
                />
              </TabsContent>

              <TabsContent value="attendance">
                <StudentAttendance />
              </TabsContent>

              <TabsContent value="achievements">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      Points & Achievements
                    </CardTitle>
                    <CardDescription>
                      Track your progress and earn points
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center py-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
                          <Star className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-4xl font-mono font-bold">{studentData.points || 0}</h3>
                        <p className="text-muted-foreground">Total Points</p>
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4">How to earn points:</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span>AI Test Score above 6</span>
                            <span className="font-mono text-primary">+5 points</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span>AI Test Score 7-8</span>
                            <span className="font-mono text-primary">+8 points</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span>AI Test Score 9-10</span>
                            <span className="font-mono text-primary">+10 points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
