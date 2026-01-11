import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

interface Student {
  email: string;
  branch: string;
  full_name: string;
  username: string | null;
}

interface AttendanceRecord {
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

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [selectedBranch, currentMonth]);

  const fetchStudentsAndAttendance = async () => {
    setIsLoading(true);
    try {
      // Fetch students for the selected branch
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('email, branch, full_name, username')
        .eq('branch', selectedBranch);

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch attendance for the entire month
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_email, date')
        .eq('branch', selectedBranch)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (attendanceError) throw attendanceError;
      setAttendanceRecords(attendanceData || []);
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
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_email: studentEmail,
          branch: selectedBranch,
          date: dateStr,
          marked_by: 'admin',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Attendance already marked for this date');
        } else {
          throw error;
        }
      } else {
        toast.success('Attendance marked!');
        setAttendanceRecords(prev => [...prev, { student_email: studentEmail, date: dateStr }]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setMarking(null);
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
          Mark and view attendance for students by branch and date
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
              <p>No students registered in {branchShortNames[selectedBranch]}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{students.length} students in {branchShortNames[selectedBranch]}</span>
                <span>{todayAttendance.length} present on {format(selectedDate, 'MMM d')}</span>
              </div>
              
              <div className="space-y-2">
                {students.map((student) => {
                  const isMarked = isAttendanceMarked(student.email, selectedDate);
                  const monthlyCount = getStudentAttendanceForMonth(student.email);
                  
                  return (
                    <div
                      key={student.email}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {student.full_name || student.username || student.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This month: {monthlyCount} day{monthlyCount !== 1 ? 's' : ''}
                        </p>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAttendance;