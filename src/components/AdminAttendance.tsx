import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Loader2, Users, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

interface Student {
  email: string;
  branch: string;
  full_name: string;
  username: string | null;
  roll_no: number | null;
}

interface AttendanceRecord {
  id: string;
  student_email: string;
  date: string;
}

// Branch mapping
const branchShortNames: Record<string, string> = {
  computer_engineering: "CE",
  cst: "CST",
  data_science: "DS",
  ai: "AI",
  ece: "ECE",
};

const branches = [
  { value: "computer_engineering", label: "CE - Computer Engineering" },
  { value: "cst", label: "CST - Computer Science and Technology" },
  { value: "data_science", label: "DS - Data Science" },
  { value: "ai", label: "AI - Artificial Intelligence" },
  { value: "ece", label: "ECE - Electronics and Communication" },
];

const AdminAttendance = () => {
  const [selectedBranch, setSelectedBranch] = useState("computer_engineering");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [unmarking, setUnmarking] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [selectedBranch, currentMonth]);

  const fetchStudentsAndAttendance = async () => {
    setIsLoading(true);
    try {
      const adminToken = localStorage.getItem("admin_session_token");
      if (!adminToken) {
        throw new Error("Admin session expired. Please login again.");
      }

      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const [studentsResp, attendanceResp] = await Promise.all([
        supabase.functions.invoke("admin-api", {
          body: { action: "get_logged_in_students_by_branch", adminToken, branch: selectedBranch },
        }),
        supabase.functions.invoke("admin-api", {
          body: { action: "get_attendance_by_branch_month", adminToken, branch: selectedBranch, monthStart, monthEnd },
        }),
      ]);

      if (studentsResp.error) throw new Error(studentsResp.error.message);
      if (attendanceResp.error) throw new Error(attendanceResp.error.message);

      if (studentsResp.data?.error) throw new Error(studentsResp.data.error);
      if (attendanceResp.data?.error) throw new Error(attendanceResp.data.error);

      // Sort students by roll number (null values at the end)
      const sortedStudents = (studentsResp.data?.students || []).sort((a: Student, b: Student) => {
        if (a.roll_no === null && b.roll_no === null) return 0;
        if (a.roll_no === null) return 1;
        if (b.roll_no === null) return -1;
        return a.roll_no - b.roll_no;
      });

      setStudents(sortedStudents);
      setAttendanceRecords(attendanceResp.data?.attendance || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const markAttendance = async (studentEmail: string) => {
    setMarking(studentEmail);
    try {
      const adminToken = localStorage.getItem("admin_session_token");
      if (!adminToken) {
        throw new Error("Admin session expired. Please login again.");
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action: "mark_attendance", adminToken, branch: selectedBranch, date: dateStr, studentEmail },
      });

      if (error) throw new Error(error.message);
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Attendance marked!');
      // Add to local state with a temporary ID
      setAttendanceRecords(prev => [...prev, { id: crypto.randomUUID(), student_email: studentEmail, date: dateStr }]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setMarking(null);
    }
  };

  const unmarkAttendance = async (studentEmail: string) => {
    setUnmarking(studentEmail);
    try {
      const adminToken = localStorage.getItem("admin_session_token");
      if (!adminToken) {
        throw new Error("Admin session expired. Please login again.");
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action: "unmark_attendance", adminToken, branch: selectedBranch, date: dateStr, studentEmail },
      });

      if (error) throw new Error(error.message);
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Attendance removed!');
      // Remove from local state
      setAttendanceRecords(prev => prev.filter(
        record => !(record.student_email === studentEmail && record.date === dateStr)
      ));
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove attendance');
    } finally {
      setUnmarking(null);
    }
  };

  const isAttendanceMarked = (studentEmail: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendanceRecords.some(
      record => record.student_email === studentEmail && record.date === dateStr
    );
  };

  const getStudentAttendanceForMonth = (studentEmail: string) => {
    return attendanceRecords.filter(record => record.student_email === studentEmail).length;
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayAttendance = attendanceRecords.filter(r => r.date === selectedDateStr);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Attendance Management
        </CardTitle>
        <CardDescription>
          Mark and view attendance for students by branch and date. Only students currently logged in are shown.
          Click on "Present" to remove attendance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Branch and Month Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
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

            {/* Month Navigation */}
            <div className="space-y-2">
              <Label>Month</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 text-center font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Date Picker */}
          <div className="space-y-2">
            <Label>Select Date to Mark Attendance</Label>
            <div className="flex flex-wrap gap-1 p-3 bg-muted/50 rounded-lg">
              {daysInMonth.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const hasAttendance = attendanceRecords.some(r => r.date === format(day, 'yyyy-MM-dd'));
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`w-9 h-9 text-sm rounded-md transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isToday
                        ? 'bg-secondary text-secondary-foreground'
                        : hasAttendance
                        ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Student List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No students currently logged in for {branchShortNames[selectedBranch]}</p>
              <p className="text-sm mt-2">Students need to log in to appear here for attendance marking</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{students.length} students in {branchShortNames[selectedBranch]}</span>
                <span>{todayAttendance.length} present on {format(selectedDate, 'MMM d')}</span>
              </div>
              
              <div className="space-y-2">
                {students.map((student, index) => {
                  const isMarked = isAttendanceMarked(student.email, selectedDate);
                  const monthlyCount = getStudentAttendanceForMonth(student.email);
                  
                  return (
                    <div
                      key={student.email}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {student.roll_no || (index + 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {student.full_name || student.username || student.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Roll No: {student.roll_no || 'Not set'} • This month: {monthlyCount} day{monthlyCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {isMarked ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unmarkAttendance(student.email)}
                          disabled={unmarking === student.email}
                          className="text-green-500 hover:text-red-500 hover:bg-red-500/10"
                        >
                          {unmarking === student.email ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-1" />
                              <span>Present</span>
                            </>
                          )}
                        </Button>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAttendance;
