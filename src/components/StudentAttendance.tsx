import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  student_email: string;
  branch: string;
  date: string;
  marked_at: string;
  marked_by: string;
}

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    const sessionToken = localStorage.getItem("student_session_token");
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { action: "get_attendance", sessionToken },
      });

      if (data?.success) {
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalDays = attendance.length;
  const currentMonth = new Date().getMonth();
  const currentMonthAttendance = attendance.filter(
    (a) => new Date(a.date).getMonth() === currentMonth
  ).length;

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Total Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-bold">{totalDays}</p>
            <p className="text-sm text-muted-foreground">Days present</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-bold">{currentMonthAttendance}</p>
            <p className="text-sm text-muted-foreground">Days this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Attendance History
          </CardTitle>
          <CardDescription>
            Your attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records yet</p>
              <p className="text-sm">Your attendance will appear here once marked by admin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(record.date), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Marked at {format(new Date(record.marked_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;