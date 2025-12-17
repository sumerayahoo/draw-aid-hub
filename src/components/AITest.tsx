import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Upload, Clock, CheckCircle, XCircle, AlertCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import Header from "./Header";

interface EvaluationResult {
  score: number;
  accuracy: number;
  errors: string[];
  feedback: string;
}

interface AITestProps {
  drawingType: string;
  onBack: () => void;
}

const AITest = ({ drawingType, onBack }: AITestProps) => {
  // Timer state
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Evaluation state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [userDrawing, setUserDrawing] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setTestEnded(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const startTest = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
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
    setReferenceImage(null);
    setUserDrawing(null);
    setResult(null);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
    } catch (error) {
      console.error('Evaluation error:', error);
      setResult({
        score: 0,
        accuracy: 0,
        errors: ['Failed to evaluate drawing. Please try again.'],
        feedback: 'An error occurred during evaluation.',
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative">
        <div className="absolute inset-0 blueprint-grid opacity-30" />

        <div className="relative container mx-auto px-4 py-12">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Resources</span>
          </motion.button>

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

                <p className="text-muted-foreground mt-8 text-sm">
                  Complete your drawing. When ready, click "End Test" to submit for evaluation.
                </p>
              </div>
            </motion.div>
          )}

          {/* Test Ended - Evaluation Phase */}
          {testEnded && !result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                <div className="text-center mb-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h2 className="font-mono text-2xl font-bold mb-2">Test Complete!</h2>
                  <p className="text-muted-foreground">
                    Upload your reference image and drawing for AI evaluation
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Reference Image Upload */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Reference Image</Label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        referenceImage ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {referenceImage ? (
                        <div className="space-y-3">
                          <img
                            src={referenceImage}
                            alt="Reference"
                            className="max-h-48 mx-auto rounded-lg object-contain"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReferenceImage(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload reference
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReferenceUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* User Drawing Upload */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Your Drawing</Label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        userDrawing ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {userDrawing ? (
                        <div className="space-y-3">
                          <img
                            src={userDrawing}
                            alt="Your Drawing"
                            className="max-h-48 mx-auto rounded-lg object-contain"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserDrawing(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload your drawing
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUserDrawingUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={resetTest}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start New Test
                  </Button>
                  <Button
                    onClick={evaluateDrawing}
                    disabled={!referenceImage || !userDrawing || isEvaluating}
                    className="flex-1"
                  >
                    {isEvaluating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Evaluating...
                      </>
                    ) : (
                      "Get AI Evaluation"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto mt-8"
              >
                <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                  <h2 className="font-mono text-2xl font-bold mb-6 text-center">
                    Test Results
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Score */}
                    <div className="text-center p-6 rounded-xl bg-muted/50">
                      <span className="text-sm text-muted-foreground block mb-2">Score</span>
                      <span className={`text-5xl font-bold font-mono ${getScoreColor(result.score)}`}>
                        {result.score}/10
                      </span>
                    </div>

                    {/* Accuracy */}
                    <div className="text-center p-6 rounded-xl bg-muted/50">
                      <span className="text-sm text-muted-foreground block mb-2">Accuracy</span>
                      <span className={`text-5xl font-bold font-mono ${getScoreColor(result.accuracy / 10)}`}>
                        {result.accuracy}%
                      </span>
                    </div>
                  </div>

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-2">
                        {result.errors.map((error, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Feedback</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {result.feedback}
                    </p>
                  </div>

                  <Button onClick={resetTest} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Take Another Test
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AITest;
