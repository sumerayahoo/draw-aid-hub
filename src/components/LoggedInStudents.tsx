import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2, Star, Clock } from "lucide-react";
import { format } from "date-fns";

interface Student {
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  lastLogin: string;
  points: number;
}

interface GroupedStudents {
  [branch: string]: Student[];
}

const branches: Record<string, string> = {
  computer_engineering: "Computer Engineering",
  cst: "Computer Science and Technology",
  data_science: "Data Science",
  ai: "Artificial Intelligence",
  ece: "Electronics and Communication",
};

const LoggedInStudents = () => {
  const [students, setStudents] = useState<GroupedStudents>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState<string>("all");

  useEffect(() => {
    fetchLoggedInStudents();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLoggedInStudents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLoggedInStudents = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "get_logged_in_students" },
      });

      if (error) throw error;
      if (data?.success) {
        setStudents(data.students || {});
      }
    } catch (error) {
      console.error("Error fetching logged in students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalStudents = () => {
    return Object.values(students).reduce((total, branchStudents) => total + branchStudents.length, 0);
  };

  const getAllStudents = () => {
    return Object.entries(students).flatMap(([branch, branchStudents]) => 
      branchStudents.map(student => ({ ...student, branch }))
    );
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const branchKeys = Object.keys(students);
  const totalStudents = getTotalStudents();

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Logged In Students
        </CardTitle>
        <CardDescription>
          {totalStudents} student{totalStudents !== 1 ? "s" : ""} currently logged in
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalStudents === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No students currently logged in</p>
          </div>
        ) : (
          <Tabs value={activeBranch} onValueChange={setActiveBranch}>
            <TabsList className="flex flex-wrap h-auto gap-2 mb-6">
              <TabsTrigger value="all" className="gap-2">
                All
                <Badge variant="secondary" className="ml-1">{totalStudents}</Badge>
              </TabsTrigger>
              {branchKeys.map(branch => (
                <TabsTrigger key={branch} value={branch} className="gap-2">
                  {branches[branch]?.split(" ")[0] || branch}
                  <Badge variant="secondary" className="ml-1">{students[branch].length}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {getAllStudents().map((student) => (
                  <StudentCard key={student.email} student={student} showBranch />
                ))}
              </div>
            </TabsContent>

            {branchKeys.map(branch => (
              <TabsContent key={branch} value={branch}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {students[branch].map((student) => (
                    <StudentCard key={student.email} student={student} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

const StudentCard = ({ student, showBranch = false }: { student: Student & { branch?: string }; showBranch?: boolean }) => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
      <Avatar className="w-12 h-12">
        <AvatarImage src={student.avatarUrl} alt={student.fullName || student.username} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          {student.fullName?.[0] || student.username?.[0] || student.email[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {student.fullName || student.username || student.email.split("@")[0]}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          @{student.username || student.email.split("@")[0]}
        </p>
        {showBranch && student.branch && (
          <Badge variant="outline" className="mt-1 text-xs">
            {branches[student.branch]?.split(" ")[0] || student.branch}
          </Badge>
        )}
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
          <Star className="w-4 h-4" />
          {student.points || 0}
        </div>
        {student.lastLogin && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {format(new Date(student.lastLogin), "HH:mm")}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoggedInStudents;
