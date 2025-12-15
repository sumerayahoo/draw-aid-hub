import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image, Brain, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { toast } from "sonner";

interface EvaluationResult {
  score: number;
  accuracy: number;
  errors: string[];
  feedback: string;
}

interface AIEvaluationProps {
  drawingType: string;
  onBack: () => void;
}

const AIEvaluation = ({ drawingType, onBack }: AIEvaluationProps) => {
  const { semesterId } = useParams<{ semesterId: string }>();
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [userDrawing, setUserDrawing] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loadingRef, setLoadingRef] = useState(true);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReferenceImage();
  }, [semesterId, drawingType]);

  const fetchReferenceImage = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('file_url')
        .eq('semester', semesterId || '1')
        .eq('drawing_type', drawingType)
        .eq('content_type', 'reference')
        .maybeSingle();

      if (data?.file_url) {
        setReferenceImage(data.file_url);
      }
    } catch (error) {
      console.error('Error fetching reference:', error);
    } finally {
      setLoadingRef(false);
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserDrawing(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const evaluateDrawing = async () => {
    if (!userDrawing || !referenceImage) {
      toast.error("Please upload both reference and your drawing");
      return;
    }
    
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

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
    } catch (error: any) {
      console.error('Evaluation error:', error);
      toast.error(error.message || "Failed to evaluate drawing");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-accent";
    if (score >= 6) return "text-secondary";
    return "text-destructive";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background blueprint-grid"
    >
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Content
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-sm mb-4">
              <Brain className="w-4 h-4" />
              AI-Powered Evaluation
            </div>
            <h1 className="font-mono text-3xl md:text-4xl font-bold mb-2">
              {drawingType.charAt(0).toUpperCase() + drawingType.slice(1)} Drawing Evaluation
            </h1>
            <p className="text-muted-foreground">
              Upload both reference and your drawing to get AI feedback
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Reference Image */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
              <h3 className="font-mono font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Reference Image
              </h3>
              <div
                onClick={() => refFileInputRef.current?.click()}
                className="aspect-square rounded-xl bg-muted border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all overflow-hidden group"
              >
                {loadingRef ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : referenceImage ? (
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground p-4 group-hover:text-primary transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Upload Reference Image</p>
                    <p className="text-xs">The correct drawing to compare against</p>
                  </div>
                )}
              </div>
              <input
                ref={refFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReferenceUpload}
                className="hidden"
              />
              {referenceImage && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Click to change reference image
                </p>
              )}
            </div>

            {/* User Drawing Upload */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
              <h3 className="font-mono font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-secondary" />
                Your Drawing
              </h3>
              <div
                onClick={() => userFileInputRef.current?.click()}
                className="aspect-square rounded-xl bg-muted border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all overflow-hidden group"
              >
                {userDrawing ? (
                  <img src={userDrawing} alt="Your drawing" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground p-4 group-hover:text-primary transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to upload your drawing</p>
                    <p className="text-xs">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={userFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUserDrawingUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Evaluate Button */}
          <div className="text-center mb-8">
            <Button
              variant="gradient"
              size="xl"
              onClick={evaluateDrawing}
              disabled={!userDrawing || !referenceImage || isEvaluating}
              className="font-mono"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Drawing...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Evaluate Drawing
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-2xl p-8 border border-border shadow-card-hover"
              >
                <h3 className="font-mono text-xl font-bold mb-6 text-center">Evaluation Results</h3>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Score */}
                  <div className="text-center">
                    <div className={`text-7xl font-mono font-bold ${getScoreColor(result.score)}`}>
                      {result.score}
                      <span className="text-2xl text-muted-foreground">/10</span>
                    </div>
                    <p className="text-muted-foreground mt-2">Overall Score</p>
                  </div>
                  
                  {/* Accuracy */}
                  <div className="flex flex-col justify-center">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Accuracy</span>
                      <span className="font-mono text-primary">{result.accuracy}%</span>
                    </div>
                    <Progress value={result.accuracy} className="h-3" />
                  </div>
                </div>

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-mono font-semibold mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {result.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground bg-destructive/5 rounded-lg p-3">
                          <span className="text-destructive">•</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Feedback */}
                <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
                  <h4 className="font-mono font-semibold mb-2 flex items-center gap-2 text-accent">
                    <CheckCircle className="w-5 h-5" />
                    AI Feedback
                  </h4>
                  <p className="text-sm text-muted-foreground">{result.feedback}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AIEvaluation;
