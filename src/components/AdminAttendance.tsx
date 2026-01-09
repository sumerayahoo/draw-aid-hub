import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Student {
  email: string;
  branch: string;
  full_name: string;
}

interface AttendanceRecord {
  id: string;
  student_email: string;
  branch: string;
  date: string;
  marked_at: string;
}

const branches = [
  { value: "computer_engineering", label: "Computer Engineering" },
  { value: "cst", label: "Computer Science and Technology" },
  { value: "data_science", label: "Data Science" },
  { value: "ai", label: "Artificial Intelligence" },
  { value: "ece", label: "Electronics and Communication" },
];

const AdminAttendance = () => {
  const [selectedBranch, setSelectedBranch] = useState("computer_engineering");
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [selectedBranch]);

  const fetchStudentsAndAttendance = async () => {
    setIsLoading(true);
    try {
      // Fetch students for the selected branch
      const { data: studentsData } = await supabase
        .from('students')
        .select('email, branch, full_name')
        .eq('branch', selectedBranch);

      setStudents(studentsData || []);

      // Fetch today's attendance
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_email')
        .eq('branch', selectedBranch)
        .eq('date', today);

      setTodayAttendance(attendanceData?.map(a => a.student_email) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAttendance = async (studentEmail: string) => {
    setMarking(studentEmail);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_email: studentEmail,
          branch: selectedBranch,
          date: today,
          marked_by: 'admin',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Attendance already marked for today');
        } else {
          throw error;
        }
      } else {
        toast.success('Attendance marked!');
        setTodayAttendance(prev => [...prev, studentEmail]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setMarking(null);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Mark Attendance
        </CardTitle>
        <CardDescription>
          Mark attendance for students by branch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Select Branch</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
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

          <div className="text-sm text-muted-foreground">
            Today: {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No students registered in this branch</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const isMarked = todayAttendance.includes(student.email);
                return (
                  <div
                    key={student.email}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{student.full_name || student.email}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    {isMarked ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Present</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => markAttendance(student.email)}
                        disabled={marking === student.email}
                      >
                        {marking === student.email ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Mark Present"
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAttendance;