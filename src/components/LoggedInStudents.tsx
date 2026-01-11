import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2, Star, Clock, Trophy } from "lucide-react";
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

// Branch mapping - full name to short form
const branchShortNames: Record<string, string> = {
  computer_engineering: "CE",
  cst: "CST",
  data_science: "DS",
  ai: "AI",
  ece: "ECE",
};

const branchFullNames: Record<string, string> = {
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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

  const getLeaderboard = () => {
    return getAllStudents()
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 20);
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
    <div className="space-y-6">
      {/* Leaderboard Toggle */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowLeaderboard(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            !showLeaderboard ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          <Users className="w-4 h-4" />
          Students
        </button>
        <button
          onClick={() => setShowLeaderboard(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showLeaderboard ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Leaderboard
        </button>
      </div>

      {showLeaderboard ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Points Leaderboard
            </CardTitle>
            <CardDescription>
              Top students by points earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getLeaderboard().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No students with points yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getLeaderboard().map((student, index) => (
                  <div
                    key={student.email}
                    className={`flex items-center gap-3 p-4 rounded-lg border ${
                      index === 0
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : index === 1
                        ? "bg-gray-400/10 border-gray-400/30"
                        : index === 2
                        ? "bg-amber-600/10 border-amber-600/30"
                        : "bg-muted/50 border-border/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                        ? "bg-gray-400 text-white"
                        : index === 2
                        ? "bg-amber-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={student.avatarUrl} alt={student.fullName || student.username} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                        {student.fullName?.[0] || student.username?.[0] || student.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {student.fullName || student.username || student.email.split("@")[0]}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {branchShortNames[student.branch] || student.branch}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-lg font-bold text-yellow-600">
                      <Star className="w-5 h-5 fill-yellow-500" />
                      {student.points || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
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
                      {branchShortNames[branch] || branch}
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
      )}
    </div>
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
            {branchShortNames[student.branch] || student.branch}
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