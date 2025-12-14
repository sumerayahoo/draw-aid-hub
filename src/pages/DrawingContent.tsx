import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import ContentCard from "@/components/ContentCard";
import AIEvaluation from "@/components/AIEvaluation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Video, Box, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data - in production, this would come from database
const mockContent = {
  pyqs: [
    { id: 1, title: "2023 Mid-Semester Exam", file: "#" },
    { id: 2, title: "2022 End-Semester Exam", file: "#" },
    { id: 3, title: "2023 Quiz Paper", file: "#" },
  ],
  videos: [
    { id: 1, title: "Introduction to Projections", url: "#", duration: "12:34" },
    { id: 2, title: "Drawing Front View", url: "#", duration: "18:45" },
    { id: 3, title: "Common Mistakes to Avoid", url: "#", duration: "8:20" },
  ],
  objects: [
    { id: 1, title: "Simple Bracket", image: "/placeholder.svg" },
    { id: 2, title: "Machine Block", image: "/placeholder.svg" },
    { id: 3, title: "Bearing Housing", image: "/placeholder.svg" },
  ],
};

const typeLabels: Record<string, string> = {
  orthographic: "Orthographic Projection",
  isometric: "Isometric Drawing",
  sectional: "Sectional Orthographic",
};

const DrawingContent = () => {
  const { semesterId, drawingType } = useParams<{ semesterId: string; drawingType: string }>();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [showAIEvaluation, setShowAIEvaluation] = useState(false);

  const semester = parseInt(semesterId || "1");
  const type = drawingType || "orthographic";

  if (showAIEvaluation) {
    return (
      <AIEvaluation
        drawingType={type}
        onBack={() => setShowAIEvaluation(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        {/* Background */}
        <div className="absolute inset-0 blueprint-grid opacity-30" />
        
        <div className="relative container mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <span>Semester {semester}</span>
              <span>•</span>
              <span className="text-primary">{typeLabels[type]}</span>
            </div>
            <h1 className="font-mono text-3xl md:text-4xl font-bold mb-3">
              Learning Resources
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Access study materials, practice with past papers, and evaluate your drawings with AI
            </p>
          </motion.div>
          
          {/* Content Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ContentCard
              type="pyqs"
              onClick={() => setActiveDialog("pyqs")}
              delay={0.1}
            />
            <ContentCard
              type="videos"
              onClick={() => setActiveDialog("videos")}
              delay={0.2}
            />
            <ContentCard
              type="objects"
              onClick={() => setActiveDialog("objects")}
              delay={0.3}
            />
            <ContentCard
              type="ai-evaluation"
              onClick={() => setShowAIEvaluation(true)}
              delay={0.4}
            />
          </div>
        </div>
      </div>

      {/* PYQs Dialog */}
      <Dialog open={activeDialog === "pyqs"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Previous Year Questions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {mockContent.pyqs.length > 0 ? (
              mockContent.pyqs.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{item.title}</span>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No papers available yet. Admin can upload in the admin panel.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Videos Dialog */}
      <Dialog open={activeDialog === "videos"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Video className="w-5 h-5 text-secondary" />
              Video Tutorials
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {mockContent.videos.length > 0 ? (
              mockContent.videos.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-medium block">{item.title}</span>
                    <span className="text-sm text-muted-foreground">{item.duration}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Watch
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No videos available yet. Admin can upload in the admin panel.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Objects Dialog */}
      <Dialog open={activeDialog === "objects"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Box className="w-5 h-5 text-accent" />
              Reference Objects
            </DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {mockContent.objects.length > 0 ? (
              mockContent.objects.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-muted/50 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Box className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                  <div className="p-4">
                    <span className="font-medium">{item.title}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8 col-span-2">
                No objects available yet. Admin can upload in the admin panel.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DrawingContent;
