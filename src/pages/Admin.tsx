import { useState, useEffect, useRef } from "react";
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
import { FileText, Video, Box, Image, Upload, Plus, Trash2, Shield, LogOut, Loader2, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import AdminAttendance from "@/components/AdminAttendance";
import LoggedInStudents from "@/components/LoggedInStudents";

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
  const [videoUrl, setVideoUrl] = useState("");
  const fileInputRefs = {
    pyq: useRef<HTMLInputElement>(null),
    object: useRef<HTMLInputElement>(null),
    reference: useRef<HTMLInputElement>(null),
  };
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    fetchContent();
  }, [selectedSemester, selectedType]);

  const checkAdminAccess = async () => {
    const adminSession = localStorage.getItem("admin_session");
    if (adminSession !== "active") {
      navigate('/admin-login');
      return;
    }
    setIsLoading(false);
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
    toast.success("Logged out successfully!");
    navigate('/admin-login');
  };

  const uploadFile = async (file: File, contentType: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedSemester}/${selectedType}/${contentType}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('content')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('content')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handlePYQUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !titles.pyq.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    setUploading('pyq');
    try {
      const fileUrl = await uploadFile(file, 'pyq');
      
      const { error } = await supabase.from('content').insert({
        semester: selectedSemester,
        drawing_type: selectedType,
        content_type: 'pyq',
        title: titles.pyq,
        file_url: fileUrl,
      });

      if (error) throw error;
      
      toast.success("PYQ uploaded successfully!");
      setTitles(prev => ({ ...prev, pyq: "" }));
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload");
    } finally {
      setUploading(null);
    }
  };

  const handleVideoAdd = async () => {
    if (!titles.video.trim() || !videoUrl.trim()) {
      toast.error("Please enter both title and URL");
      return;
    }

    setUploading('video');
    try {
      const { error } = await supabase.from('content').insert({
        semester: selectedSemester,
        drawing_type: selectedType,
        content_type: 'video',
        title: titles.video,
        file_url: videoUrl,
      });

      if (error) throw error;
      
      toast.success("Video added successfully!");
      setTitles(prev => ({ ...prev, video: "" }));
      setVideoUrl("");
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to add video");
    } finally {
      setUploading(null);
    }
  };

  const handleObjectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !titles.object.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    setUploading('object');
    try {
      const fileUrl = await uploadFile(file, 'object');
      
      const { error } = await supabase.from('content').insert({
        semester: selectedSemester,
        drawing_type: selectedType,
        content_type: 'object',
        title: titles.object,
        file_url: fileUrl,
      });

      if (error) throw error;
      
      toast.success("Object image uploaded successfully!");
      setTitles(prev => ({ ...prev, object: "" }));
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload");
    } finally {
      setUploading(null);
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('reference');
    try {
      // Delete existing reference for this section
      const existing = content.find(c => c.content_type === 'reference');
      if (existing) {
        await supabase.from('content').delete().eq('id', existing.id);
      }

      const fileUrl = await uploadFile(file, 'reference');
      
      const { error } = await supabase.from('content').insert({
        semester: selectedSemester,
        drawing_type: selectedType,
        content_type: 'reference',
        title: `Reference - Sem ${selectedSemester} ${selectedType}`,
        file_url: fileUrl,
      });

      if (error) throw error;
      
      toast.success("Reference image set successfully!");
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('content').delete().eq('id', id);
      if (error) throw error;
      toast.success("Content deleted!");
      fetchContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const referenceImage = content.find(c => c.content_type === 'reference');

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
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
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
              <TabsList className="grid grid-cols-6 max-w-4xl mb-8">
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
                <TabsTrigger value="reference" className="gap-2">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Reference</span>
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
                      Upload PDF files for past exam papers and practice questions
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
                          <Label>PDF File</Label>
                          <div 
                            onClick={() => titles.pyq && fileInputRefs.pyq.current?.click()}
                            className={`mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors cursor-pointer ${titles.pyq ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'}`}
                          >
                            {uploading === 'pyq' ? (
                              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  {titles.pyq ? 'Click to upload' : 'Enter title first'}
                                </p>
                              </>
                            )}
                          </div>
                          <input
                            ref={fileInputRefs.pyq}
                            type="file"
                            accept=".pdf"
                            onChange={handlePYQUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* List existing PYQs */}
                      <div className="mt-6 space-y-2">
                        {content.filter(c => c.content_type === 'pyq').map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span>{item.title}</span>
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
                      Add video tutorials with YouTube or direct video links
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
                          <Label>Video URL</Label>
                          <Input 
                            placeholder="https://youtube.com/watch?v=..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleVideoAdd} 
                        className="gap-2"
                        disabled={uploading === 'video'}
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
                            <span>{item.title}</span>
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
                      Reference Objects
                    </CardTitle>
                    <CardDescription>
                      Upload images of 3D objects for drawing practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <Label>Object Name</Label>
                          <Input 
                            placeholder="e.g., Simple Bracket"
                            value={titles.object}
                            onChange={(e) => setTitles(prev => ({ ...prev, object: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Object Image</Label>
                          <div 
                            onClick={() => titles.object && fileInputRefs.object.current?.click()}
                            className={`mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors cursor-pointer ${titles.object ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'}`}
                          >
                            {uploading === 'object' ? (
                              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  {titles.object ? 'Click to upload' : 'Enter name first'}
                                </p>
                              </>
                            )}
                          </div>
                          <input
                            ref={fileInputRefs.object}
                            type="file"
                            accept="image/*"
                            onChange={handleObjectUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* List existing objects */}
                      <div className="mt-6 space-y-2">
                        {content.filter(c => c.content_type === 'object').map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              {item.file_url && (
                                <img src={item.file_url} alt={item.title} className="w-10 h-10 object-cover rounded" />
                              )}
                              <span>{item.title}</span>
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

              {/* Reference Images Tab */}
              <TabsContent value="reference">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono flex items-center gap-2">
                      <Image className="w-5 h-5 text-primary" />
                      AI Reference Images
                    </CardTitle>
                    <CardDescription>
                      Upload reference images for AI drawing evaluation. These images will be used to compare and evaluate student submissions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                        <p className="font-medium text-primary mb-1">Important</p>
                        <p className="text-muted-foreground">
                          Upload a clear, accurate reference drawing. The AI will compare student submissions against this image.
                        </p>
                      </div>
                      
                      {referenceImage && (
                        <div className="p-4 rounded-xl bg-muted/50">
                          <p className="text-sm font-medium mb-2">Current Reference:</p>
                          <img 
                            src={referenceImage.file_url || ''} 
                            alt="Reference" 
                            className="max-w-xs rounded-lg border border-border"
                          />
                        </div>
                      )}

                      <div>
                        <Label>Reference Drawing Image</Label>
                        <div 
                          onClick={() => fileInputRefs.reference.current?.click()}
                          className="mt-2 border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-primary/5"
                        >
                          {uploading === 'reference' ? (
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
                              <p className="text-sm font-medium">
                                {referenceImage ? 'Replace Reference Image' : 'Upload Reference Image'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          ref={fileInputRefs.reference}
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceUpload}
                          className="hidden"
                        />
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

export default Admin;
