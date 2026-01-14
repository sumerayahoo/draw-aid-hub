import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Video, Box, Plus, Trash2, Shield, LogOut, Loader2, Calendar, Users, Link as LinkIcon, Key, Settings } from "lucide-react";
import { toast } from "sonner";
import AdminAttendance from "@/components/AdminAttendance";
import LoggedInStudents from "@/components/LoggedInStudents";
import { isGoogleDriveUrl, isYouTubeUrl } from "@/lib/googleDrive";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ContentItem {
  id: string;
  title: string;
  file_url: string | null;
  content_type: string;
  semester: string;
  drawing_type: string;
}

const Admin = () => {
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedType, setSelectedType] = useState("orthographic");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [titles, setTitles] = useState({ pyq: "", video: "", object: "" });
  const [urls, setUrls] = useState({ pyq: "", video: "", object: "" });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    fetchContent();
  }, [selectedSemester, selectedType]);

  const checkAdminAccess = async () => {
    const adminToken = localStorage.getItem("admin_session_token");
    if (!adminToken) {
      navigate("/admin-login");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action: "verify", adminToken },
      });

      if (error || !data?.valid) {
        localStorage.removeItem("admin_session_token");
        localStorage.removeItem("admin_session");
        navigate("/admin-login");
        return;
      }

      setIsLoading(false);
    } catch {
      localStorage.removeItem("admin_session_token");
      localStorage.removeItem("admin_session");
      navigate("/admin-login");
    }
  };

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('semester', selectedSemester)
        .eq('drawing_type', selectedType);

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("admin_session");
    localStorage.removeItem("admin_session_token");
    toast.success("Logged out successfully!");
    navigate('/admin-login');
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }
    
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsResettingPassword(true);
    try {
      const adminToken = localStorage.getItem("admin_session_token");
      if (!adminToken) throw new Error("Admin session expired");

      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action: "reset_password", adminToken, newPassword },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success("Password reset initiated! " + (data?.message || ""));
      setShowPasswordReset(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const insertContentRow = async (payload: { semester: string; drawing_type: string; content_type: string; title: string; file_url: string | null; }) => {
    const adminToken = localStorage.getItem("admin_session_token");
    if (!adminToken) throw new Error("Admin session expired. Please login again.");

    const { data, error } = await supabase.functions.invoke("admin-api", {
      body: { action: "insert_content", adminToken, contentItem: payload },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
  };

  const deleteContentRow = async (id: string) => {
    const adminToken = localStorage.getItem("admin_session_token");
    if (!adminToken) throw new Error("Admin session expired. Please login again.");

    const { data, error } = await supabase.functions.invoke("admin-api", {
      body: { action: "delete_content", adminToken, contentId: id },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
  };

  const validateUrl = (url: string, type: 'pyq' | 'video' | 'object'): boolean => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return false;
    }
    
    const isGDrive = isGoogleDriveUrl(url);
    const isYT = isYouTubeUrl(url);
    
    if (type === 'video') {
      if (!isGDrive && !isYT) {
        toast.error("Please enter a valid Google Drive or YouTube URL");
        return false;
      }
    } else {
      if (!isGDrive) {
        toast.error("Please enter a valid Google Drive URL");
        return false;
      }
    }
    
    return true;
  };

  const handlePYQAdd = async () => {
    if (!titles.pyq.trim()) {
      toast.error("Please enter a title first");
      return;
    }
    
    if (!validateUrl(urls.pyq, 'pyq')) return;

    setUploading('pyq');
    try {
      await insertContentRow({
        semester: selectedSemester,
        drawing_type: selectedType,
        content_type: 'pyq',
        title: titles.pyq,
        file_url: urls.pyq.trim(),
      });

      toast.success("PYQ added successfully!");
      setTitles(prev => ({ ...prev, pyq: "" }));
      setUrls(prev => ({ ...prev, pyq: "" }));
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to add PYQ");
    } finally {
      setUploading(null);
    }
  };

  const handleVideoAdd = async () => {
    if (!titles.video.trim()) {
      toast.error("Please enter a title first");
      return;
    }
    
    if (!validateUrl(urls.video, 'video')) return;

    setUploading('video');
    try {
      await insertContentRow({
        semester: selectedSemester,
        drawing_type: selectedType,
        content_type: 'video',
        title: titles.video,
        file_url: urls.video.trim(),
      });

      toast.success("Video added successfully!");
      setTitles(prev => ({ ...prev, video: "" }));
      setUrls(prev => ({ ...prev, video: "" }));
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to add video");
    } finally {
      setUploading(null);
    }
  };

  const handleObjectAdd = async () => {
    if (!titles.object.trim()) {
      toast.error("Please enter a title first");
      return;
    }
    
    if (!validateUrl(urls.object, 'object')) return;

    setUploading('object');
    try {
      await insertContentRow({
        semester: selectedSemester,
        drawing_type: selectedType,
        content_type: 'object',
        title: titles.object,
        file_url: urls.object.trim(),
      });

      toast.success("Object added successfully!");
      setTitles(prev => ({ ...prev, object: "" }));
      setUrls(prev => ({ ...prev, object: "" }));
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to add object");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContentRow(id);
      toast.success("Content deleted!");
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const getUrlTypeLabel = (url: string | null): string => {
    if (!url) return "";
    if (isYouTubeUrl(url)) return "YouTube";
    if (isGoogleDriveUrl(url)) return "Google Drive";
    return "Link";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 blueprint-dots opacity-20" />
        
        <div className="relative container mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <h1 className="font-mono text-2xl md:text-3xl font-bold">Admin Panel</h1>
              </div>
              <p className="text-muted-foreground">
                Manage content for all semesters and drawing types
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPasswordReset(true)} className="gap-2">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Password</span>
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-4 mb-8 max-w-md"
          >
            <div>
              <Label className="mb-2 block">Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Drawing Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orthographic">Orthographic</SelectItem>
                  <SelectItem value="isometric">Isometric</SelectItem>
                  <SelectItem value="sectional">Sectional Orthographic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid grid-cols-5 max-w-3xl mb-8">
                <TabsTrigger value="students" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Students</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Attendance</span>
                </TabsTrigger>
                <TabsTrigger value="pyqs" className="gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PYQs</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2">
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Videos</span>
                </TabsTrigger>
                <TabsTrigger value="objects" className="gap-2">
                  <Box className="w-4 h-4" />
                  <span className="hidden sm:inline">Objects</span>
                </TabsTrigger>
              </TabsList>

              {/* Students Tab */}
              <TabsContent value="students">
                <LoggedInStudents />
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <AdminAttendance />
              </TabsContent>

              {/* PYQs Tab */}
              <TabsContent value="pyqs">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Previous Year Questions
                    </CardTitle>
                    <CardDescription>
                      Add Google Drive links to past exam papers and practice questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input 
                            placeholder="e.g., 2023 Mid-Semester Exam"
                            value={titles.pyq}
                            onChange={(e) => setTitles(prev => ({ ...prev, pyq: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Google Drive URL</Label>
                          <Input 
                            placeholder="https://drive.google.com/file/d/..."
                            value={urls.pyq}
                            onChange={(e) => setUrls(prev => ({ ...prev, pyq: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Paste the sharing link from your Google Drive folder
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handlePYQAdd} 
                        className="gap-2"
                        disabled={uploading === 'pyq' || !titles.pyq.trim() || !urls.pyq.trim()}
                      >
                        {uploading === 'pyq' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Add PYQ
                      </Button>

                      {/* List existing PYQs */}
                      <div className="mt-6 space-y-2">
                        {content.filter(c => c.content_type === 'pyq').map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-primary" />
                              <span>{item.title}</span>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {getUrlTypeLabel(item.file_url)}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono flex items-center gap-2">
                      <Video className="w-5 h-5 text-secondary" />
                      Video Tutorials
                    </CardTitle>
                    <CardDescription>
                      Add Google Drive or YouTube video links
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <Label>Video Title</Label>
                          <Input 
                            placeholder="e.g., Introduction to Orthographic Projection"
                            value={titles.video}
                            onChange={(e) => setTitles(prev => ({ ...prev, video: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Video URL (Google Drive or YouTube)</Label>
                          <Input 
                            placeholder="https://drive.google.com/file/d/... or https://youtube.com/watch?v=..."
                            value={urls.video}
                            onChange={(e) => setUrls(prev => ({ ...prev, video: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Paste a Google Drive sharing link or YouTube video URL
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleVideoAdd} 
                        className="gap-2"
                        disabled={uploading === 'video' || !titles.video.trim() || !urls.video.trim()}
                      >
                        {uploading === 'video' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Add Video
                      </Button>

                      {/* List existing videos */}
                      <div className="mt-6 space-y-2">
                        {content.filter(c => c.content_type === 'video').map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-secondary" />
                              <span>{item.title}</span>
                              <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                                {getUrlTypeLabel(item.file_url)}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Objects Tab */}
              <TabsContent value="objects">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono flex items-center gap-2">
                      <Box className="w-5 h-5 text-accent" />
                      3D Reference Objects
                    </CardTitle>
                    <CardDescription>
                      Add Google Drive links to 3D reference images and models
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <Label>Object Title</Label>
                          <Input 
                            placeholder="e.g., Complex Assembly Model"
                            value={titles.object}
                            onChange={(e) => setTitles(prev => ({ ...prev, object: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Google Drive URL</Label>
                          <Input 
                            placeholder="https://drive.google.com/file/d/..."
                            value={urls.object}
                            onChange={(e) => setUrls(prev => ({ ...prev, object: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Paste the sharing link from your Google Drive folder
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleObjectAdd} 
                        className="gap-2"
                        disabled={uploading === 'object' || !titles.object.trim() || !urls.object.trim()}
                      >
                        {uploading === 'object' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Add Object
                      </Button>

                      {/* List existing objects */}
                      <div className="mt-6 space-y-2">
                        {content.filter(c => c.content_type === 'object').map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-accent" />
                              <span>{item.title}</span>
                              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                                {getUrlTypeLabel(item.file_url)}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Reset Admin Password
            </DialogTitle>
            <DialogDescription>
              Enter a new password for admin access. You'll need to update the ADMIN_PASSWORD secret in your backend settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordReset(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordReset} disabled={isResettingPassword}>
              {isResettingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
