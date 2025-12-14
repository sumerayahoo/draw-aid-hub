import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Video, Box, Image, Upload, Plus, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedType, setSelectedType] = useState("orthographic");

  const handleUpload = (type: string) => {
    toast.success(`${type} uploaded successfully!`, {
      description: `Added to Semester ${selectedSemester} - ${selectedType}`,
    });
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
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="font-mono text-2xl md:text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">
              Manage content for all semesters and drawing types
            </p>
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
            <Tabs defaultValue="pyqs" className="w-full">
              <TabsList className="grid grid-cols-4 max-w-2xl mb-8">
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
                          <Input placeholder="e.g., 2023 Mid-Semester Exam" />
                        </div>
                        <div>
                          <Label>PDF File</Label>
                          <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF up to 10MB
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleUpload("PYQ")} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Question Paper
                      </Button>
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
                          <Input placeholder="e.g., Introduction to Orthographic Projection" />
                        </div>
                        <div>
                          <Label>Video URL</Label>
                          <Input placeholder="https://youtube.com/watch?v=..." />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input placeholder="e.g., 12:34" />
                        </div>
                      </div>
                      <Button onClick={() => handleUpload("Video")} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Video
                      </Button>
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
                          <Input placeholder="e.g., Simple Bracket" />
                        </div>
                        <div>
                          <Label>Object Image</Label>
                          <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleUpload("Object")} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Object
                      </Button>
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
                      <div>
                        <Label>Reference Drawing Image</Label>
                        <div className="mt-2 border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-primary/5">
                          <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
                          <p className="text-sm font-medium">
                            Upload Reference Image
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => handleUpload("Reference Image")} variant="gradient" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Set Reference Image
                      </Button>
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
