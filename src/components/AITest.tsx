import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Upload, Clock, CheckCircle, XCircle, AlertCircle, Timer, History, Download, Trash2, Bell, Star, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "./Header";

interface EvaluationResult {
  score: number;
  accuracy: number;
  errors: string[];
  feedback: string;
}

interface TestHistoryItem {
  id: string;
  created_at: string;
  drawing_type: string;
  duration_seconds: number;
  score: number;
  accuracy: number;
  errors: string[];
  feedback: string | null;
}

interface RecommendedVideo {
  id: string;
  title: string;
  file_url: string | null;
}

interface AITestProps {
  drawingType: string;
  onBack: () => void;
}

// Get or create a unique user identifier for anonymous users
const getUserIdentifier = () => {
  let identifier = localStorage.getItem('test_user_id');
  if (!identifier) {
    identifier = crypto.randomUUID();
    localStorage.setItem('test_user_id', identifier);
  }
  return identifier;
};

// Check if user is logged in as student
const getStudentSession = () => {
  return localStorage.getItem('student_session_token');
};

const AITest = ({ drawingType, onBack }: AITestProps) => {
  const { toast } = useToast();
  
  // Timer state
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Evaluation state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [userDrawing, setUserDrawing] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Recommended videos (for scores < 8)
  const [recommendedVideos, setRecommendedVideos] = useState<RecommendedVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  const isYouTubeUrl = (url: string) => /youtu\.be|youtube\.com/.test(url);

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;
      const u = new URL(url);
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shorts = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
      return url;
    } catch {
      return url;
    }
  };

  // Initialize audio for timer alert
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkYyOl5qckJOIf35/gYWIi4yMjIyLi4qKiYmIiIeHh4aGhYWEhISDg4OCgoKBgYGAgIB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVEREQ=');
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setTestEnded(true);
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            toast({
              title: "⏰ Time's Up!",
              description: "Your test time has ended. Please upload your drawing for evaluation.",
              variant: "default",
            });
            return 0;
          }
          if (prev === 61) {
            toast({
              title: "⚠️ 1 Minute Remaining",
              description: "Hurry up! Only 1 minute left.",
              variant: "destructive",
            });
          }
          if (prev === 301) {
            toast({
              title: "⏱️ 5 Minutes Remaining",
              description: "5 minutes left to complete your drawing.",
            });
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, toast]);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('test_history')
        .select('*')
        .eq('user_identifier', getUserIdentifier())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, fetchHistory]);

  const extractKeywords = (text: string) => {
    const raw = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const stop = new Set(["the", "and", "or", "to", "a", "an", "of", "in", "on", "for", "with", "your", "is", "are"]);
    return Array.from(new Set(raw.filter((w) => w.length >= 4 && !stop.has(w)))).slice(0, 20);
  };

  const fetchRecommendedVideos = useCallback(async (evalResult: EvaluationResult) => {
    if (evalResult.score >= 8) {
      setRecommendedVideos([]);
      return;
    }

    setIsLoadingVideos(true);
    try {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, file_url")
        .eq("content_type", "video")
        .eq("drawing_type", drawingType)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const videos = (data || []).map((v) => ({
        id: v.id as string,
        title: v.title as string,
        file_url: (v.file_url as string | null) ?? null,
      }));

      const keywords = extractKeywords([...(evalResult.errors || []), evalResult.feedback || ""].join(" "));

      // Rank videos by how many keywords appear in the title
      const ranked = videos
        .map((v) => {
          const title = v.title.toLowerCase();
          const score = keywords.reduce((acc, k) => (title.includes(k) ? acc + 1 : acc), 0);
          return { v, score };
        })
        .sort((a, b) => b.score - a.score);

      setRecommendedVideos(ranked.slice(0, 3).map((r) => r.v));
    } catch (e) {
      console.error("Failed to fetch recommended videos:", e);
      setRecommendedVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [drawingType]);

  const startTest = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
      setInitialDuration(totalSeconds);
      setTestStarted(true);
      setIsRunning(true);
    }
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const resetTest = () => {
    setIsRunning(false);
    setTestStarted(false);
    setTestEnded(false);
    setTimeLeft(0);
    setInitialDuration(0);
    setReferenceImage(null);
    setUserDrawing(null);
    setResult(null);
    setPointsEarned(null);
    setRecommendedVideos([]);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserDrawing(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToHistory = async (evalResult: EvaluationResult) => {
    try {
      const { error } = await supabase
        .from('test_history')
        .insert({
          drawing_type: drawingType,
          duration_seconds: initialDuration,
          score: evalResult.score,
          accuracy: evalResult.accuracy,
          errors: evalResult.errors,
          feedback: evalResult.feedback,
          user_identifier: getUserIdentifier()
        });

      if (error) throw error;
      toast({
        title: "Test Saved",
        description: "Your test result has been saved to history.",
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const addPointsForScore = async (score: number) => {
    const sessionToken = getStudentSession();
    if (!sessionToken) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('student-auth', {
        body: { action: 'add_points', sessionToken, score }
      });

      if (error) throw error;
      
      if (data?.pointsAdded > 0) {
        setPointsEarned(data.pointsAdded);
        toast({
          title: "🎉 Points Earned!",
          description: `You earned ${data.pointsAdded} points! Total: ${data.totalPoints}`,
        });
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const evaluateDrawing = async () => {
    if (!referenceImage || !userDrawing) return;

    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-drawing', {
        body: {
          userDrawing,
          referenceImage,
          drawingType,
        },
      });

      if (error) throw error;
      setResult(data);
      await saveToHistory(data);

      if (data.score > 6) {
        await addPointsForScore(data.score);
      }

      await fetchRecommendedVideos(data);
    } catch (error) {
      console.error('Evaluation error:', error);
      const fallback = {
        score: 0,
        accuracy: 0,
        errors: ['Failed to evaluate drawing. Please try again.'],
        feedback: 'An error occurred during evaluation.',
      };
      setResult(fallback);
      await fetchRecommendedVideos(fallback);
    } finally {
      setIsEvaluating(false);
    }
  };

  const exportResult = (historyItem?: TestHistoryItem) => {
    const data = historyItem || (result ? {
      drawing_type: drawingType,
      duration_seconds: initialDuration,
      score: result.score,
      accuracy: result.accuracy,
      errors: result.errors,
      feedback: result.feedback,
      created_at: new Date().toISOString()
    } : null);

    if (!data) return;

    const exportData = {
      testDate: formatDate(data.created_at || new Date().toISOString()),
      drawingType: data.drawing_type,
      duration: formatTime(data.duration_seconds),
      score: `${data.score}/10`,
      accuracy: `${data.accuracy}%`,
      errors: data.errors,
      feedback: data.feedback
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-result-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Test result downloaded successfully.",
    });
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('test_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Test history item removed.",
      });
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const clearAllHistory = async () => {
    try {
      const { error } = await supabase
        .from('test_history')
        .delete()
        .eq('user_identifier', getUserIdentifier());

      if (error) throw error;
      setHistory([]);
      toast({
        title: "History Cleared",
        description: "All test history has been deleted.",
      });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  // History View
  if (showHistory) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="relative">
          <div className="absolute inset-0 blueprint-grid opacity-30" />
          <div className="relative container mx-auto px-4 py-12">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setShowHistory(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Test</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                <History className="w-4 h-4" />
                <span className="text-sm font-mono">Test History</span>
              </div>
              <h1 className="font-mono text-3xl md:text-4xl font-bold mb-3">
                Your Past Tests
              </h1>
            </motion.div>

            {history.length > 0 && (
              <div className="flex justify-end mb-4 max-w-4xl mx-auto">
                <Button variant="destructive" size="sm" onClick={clearAllHistory}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All History
                </Button>
              </div>
            )}

            <div className="space-y-4 max-w-4xl mx-auto">
              {isLoadingHistory ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No test history yet. Complete a test to see your results here.
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl p-6 border border-border/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">{formatDate(item.created_at)}</span>
                        <h3 className="font-semibold capitalize">{item.drawing_type} Drawing</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold font-mono ${getScoreColor(item.score)}`}>
                          {item.score}/10
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-mono">{item.accuracy}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      <span>Duration: {formatTime(item.duration_seconds)}</span>
                    </div>
                    {item.feedback && (
                      <p className="text-sm text-muted-foreground mb-4">{item.feedback}</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportResult(item)}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteHistoryItem(item.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative">
        <div className="absolute inset-0 blueprint-grid opacity-30" />

        <div className="relative container mx-auto px-4 py-12">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Resources</span>
            </motion.button>
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-mono">Timed Test</span>
            </div>
            <h1 className="font-mono text-3xl md:text-4xl font-bold mb-3">
              AI Drawing Test
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Set a timer, complete your drawing, then upload for AI evaluation
            </p>
            {getStudentSession() && (
              <p className="text-sm text-primary mt-2 flex items-center justify-center gap-1">
                <Star className="w-4 h-4" />
                Logged in - earn points for scores above 6!
              </p>
            )}
          </motion.div>

          {/* Timer Setup - Before test starts */}
          {!testStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Clock className="w-6 h-6 text-primary" />
                  <h2 className="font-mono text-xl font-semibold">Set Timer</h2>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Bell className="w-4 h-4" />
                  <span>Alerts at 5 min, 1 min, and when time ends</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block text-center">Hours</Label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={hours}
                      onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                      className="text-center text-2xl font-mono h-16"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block text-center">Minutes</Label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="text-center text-2xl font-mono h-16"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block text-center">Seconds</Label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={seconds}
                      onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="text-center text-2xl font-mono h-16"
                    />
                  </div>
                </div>

                <Button
                  onClick={startTest}
                  disabled={hours === 0 && minutes === 0 && seconds === 0}
                  className="w-full h-14 text-lg font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Test
                </Button>
              </div>
            </motion.div>
          )}

          {/* Active Test - Timer Running */}
          {testStarted && !testEnded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
                <div className="mb-6">
                  <span className="text-sm text-muted-foreground font-mono">Time Remaining</span>
                </div>

                <div className={`text-6xl md:text-7xl font-mono font-bold mb-8 ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                  {formatTime(timeLeft)}
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={togglePause}
                    className="w-32"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setTestEnded(true)}
                    className="w-32"
                  >
                    End Test
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Test Ended - Upload and Evaluate */}
          {testEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-mono text-xl font-semibold">Upload for Evaluation</h2>
                  <Button variant="ghost" size="sm" onClick={resetTest}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Test
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Reference Image */}
                  <div>
                    <Label className="mb-2 block">Reference Drawing</Label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        referenceImage ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => document.getElementById('reference-upload')?.click()}
                    >
                      {referenceImage ? (
                        <img src={referenceImage} alt="Reference" className="max-h-48 mx-auto rounded-lg" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Upload reference image</p>
                        </>
                      )}
                    </div>
                    <input
                      id="reference-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceUpload}
                      className="hidden"
                    />
                  </div>

                  {/* User Drawing */}
                  <div>
                    <Label className="mb-2 block">Your Drawing</Label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        userDrawing ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => document.getElementById('drawing-upload')?.click()}
                    >
                      {userDrawing ? (
                        <img src={userDrawing} alt="Your Drawing" className="max-h-48 mx-auto rounded-lg" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Upload your drawing</p>
                        </>
                      )}
                    </div>
                    <input
                      id="drawing-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleUserDrawingUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <Button
                  onClick={evaluateDrawing}
                  disabled={!referenceImage || !userDrawing || isEvaluating}
                  className="w-full h-12"
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Evaluate Drawing
                    </>
                  )}
                </Button>

                {/* Results */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-muted/50 rounded-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <h3 className="font-mono text-lg font-semibold">Evaluation Results</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className={`text-3xl font-bold font-mono ${getScoreColor(result.score)}`}>
                            {result.score}/10
                          </span>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                          <span className="text-3xl font-bold font-mono text-primary">
                            {result.accuracy}%
                          </span>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                      </div>
                    </div>

                    {pointsEarned && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium">You earned {pointsEarned} points!</span>
                      </div>
                    )}

                    {result.errors && result.errors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          Issues Found
                        </h4>
                        <ul className="space-y-1">
                          {result.errors.map((error, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-red-500">•</span>
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.feedback && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-primary" />
                          Feedback
                        </h4>
                        <p className="text-sm text-muted-foreground">{result.feedback}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportResult()}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Result
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Recommended Videos for low scores */}
                {result && result.score < 8 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 bg-secondary/10 rounded-xl border border-secondary/30"
                  >
                    <h3 className="font-mono text-lg font-semibold mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-secondary" />
                      Recommended Videos to Improve
                    </h3>
                    
                    {isLoadingVideos ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : recommendedVideos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No specific videos found for this topic. Check the video tutorials section for general resources.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {recommendedVideos.map((video) => (
                          <div key={video.id} className="bg-card rounded-lg p-4 border border-border/50">
                            <h4 className="font-medium mb-3">{video.title}</h4>
                            {video.file_url && (
                              isYouTubeUrl(video.file_url) ? (
                                <div className="aspect-video rounded-lg overflow-hidden">
                                  <iframe
                                    src={getYouTubeEmbedUrl(video.file_url)}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  />
                                </div>
                              ) : (
                                <video
                                  src={video.file_url}
                                  controls
                                  className="w-full rounded-lg"
                                />
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITest;
