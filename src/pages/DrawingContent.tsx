import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ContentCard from "@/components/ContentCard";
import AIEvaluation from "@/components/AIEvaluation";
import AITest from "@/components/AITest";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Video, Box, Loader2, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  isGoogleDriveUrl, 
  isYouTubeUrl, 
  getGoogleDrivePreviewUrl, 
  getYouTubeEmbedUrl,
  getGoogleDriveThumbnailUrl 
} from "@/lib/googleDrive";

interface ContentItem {
  id: string;
  title: string;
  file_url: string | null;
  content_type: string;
}

const typeLabels: Record<string, string> = {
  orthographic: "Orthographic Projection",
  isometric: "Isometric Drawing",
  sectional: "Sectional Orthographic",
};

const DrawingContent = () => {
  const { semesterId, drawingType } = useParams<{ semesterId: string; drawingType: string }>();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [showAIEvaluation, setShowAIEvaluation] = useState(false);
  const [showAITest, setShowAITest] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const semester = parseInt(semesterId || "1");
  const type = drawingType || "orthographic";

  useEffect(() => {
    fetchContent();
  }, [semesterId, drawingType]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('semester', semesterId || '1')
        .eq('drawing_type', type);

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pyqs = content.filter(c => c.content_type === 'pyq');
  const videos = content.filter(c => c.content_type === 'video');
  const objects = content.filter(c => c.content_type === 'object');

  const getEmbedUrl = (url: string | null): string => {
    if (!url) return "";
    if (isYouTubeUrl(url)) return getYouTubeEmbedUrl(url);
    if (isGoogleDriveUrl(url)) return getGoogleDrivePreviewUrl(url);
    return url;
  };

  const getUrlTypeLabel = (url: string | null): string => {
    if (!url) return "";
    if (isYouTubeUrl(url)) return "YouTube";
    if (isGoogleDriveUrl(url)) return "Google Drive";
    return "Link";
  };

  if (showAIEvaluation) {
    return (
      <AIEvaluation
        drawingType={type}
        onBack={() => setShowAIEvaluation(false)}
      />
    );
  }

  if (showAITest) {
    return (
      <AITest
        drawingType={type}
        onBack={() => setShowAITest(false)}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
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
            <ContentCard
              type="ai-test"
              onClick={() => setShowAITest(true)}
              delay={0.5}
            />
          </div>
        </div>
      </div>

      {/* PYQs Dialog */}
      <Dialog open={activeDialog === "pyqs"} onOpenChange={() => { setActiveDialog(null); setSelectedItem(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Previous Year Questions
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{selectedItem.title}</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => selectedItem.file_url && window.open(selectedItem.file_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedItem(null)}
                    >
                      Back to List
                    </Button>
                  </div>
                </div>
                <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                  <iframe 
                    src={getEmbedUrl(selectedItem.file_url)}
                    className="w-full h-full border-0"
                    allow="autoplay"
                    title={selectedItem.title}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : pyqs.length > 0 ? (
                  pyqs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <span className="font-medium">{item.title}</span>
                          <p className="text-xs text-muted-foreground">{getUrlTypeLabel(item.file_url)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No papers available yet. Admin can add in the admin panel.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Videos Dialog */}
      <Dialog open={activeDialog === "videos"} onOpenChange={() => { setActiveDialog(null); setSelectedItem(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Video className="w-5 h-5 text-secondary" />
              Video Tutorials
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{selectedItem.title}</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => selectedItem.file_url && window.open(selectedItem.file_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedItem(null)}
                    >
                      Back to List
                    </Button>
                  </div>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe 
                    src={getEmbedUrl(selectedItem.file_url)}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedItem.title}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : videos.length > 0 ? (
                  videos.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <Play className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <span className="font-medium">{item.title}</span>
                          <p className="text-xs text-muted-foreground">{getUrlTypeLabel(item.file_url)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Play className="w-4 h-4" />
                        Watch
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No videos available yet. Admin can add in the admin panel.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Objects Dialog */}
      <Dialog open={activeDialog === "objects"} onOpenChange={() => { setActiveDialog(null); setSelectedItem(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Box className="w-5 h-5 text-accent" />
              Reference Objects
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{selectedItem.title}</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => selectedItem.file_url && window.open(selectedItem.file_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedItem(null)}
                    >
                      Back to List
                    </Button>
                  </div>
                </div>
                <div className="aspect-square max-h-[60vh] bg-muted rounded-lg overflow-hidden">
                  <iframe 
                    src={getEmbedUrl(selectedItem.file_url)}
                    className="w-full h-full border-0"
                    allow="autoplay"
                    title={selectedItem.title}
                  />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8 col-span-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : objects.length > 0 ? (
                  objects.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-muted/50 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {item.file_url && isGoogleDriveUrl(item.file_url) ? (
                          <img 
                            src={getGoogleDriveThumbnailUrl(item.file_url, 400)} 
                            alt={item.title} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Box className={`w-16 h-16 text-muted-foreground/30 ${item.file_url && isGoogleDriveUrl(item.file_url) ? 'hidden' : ''}`} />
                      </div>
                      <div className="p-4">
                        <span className="font-medium">{item.title}</span>
                        <p className="text-xs text-muted-foreground mt-1">{getUrlTypeLabel(item.file_url)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 col-span-2">
                    No objects available yet. Admin can add in the admin panel.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DrawingContent;
