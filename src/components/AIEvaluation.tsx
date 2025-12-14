import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, Brain, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface EvaluationResult {
  score: number;
  accuracy: number;
  errors: string[];
  feedback: string;
}

interface AIEvaluationProps {
  referenceImage?: string;
  drawingType: string;
  onBack: () => void;
}

const AIEvaluation = ({ referenceImage, drawingType, onBack }: AIEvaluationProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const evaluateDrawing = async () => {
    if (!uploadedImage) return;
    
    setIsEvaluating(true);
    
    // Simulate AI evaluation (in production, this would call an actual AI service)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock evaluation result
    const mockResult: EvaluationResult = {
      score: Math.floor(Math.random() * 3) + 7, // 7-10
      accuracy: Math.floor(Math.random() * 15) + 80, // 80-95%
      errors: [
        "Minor misalignment in the top view projection",
        "Line weight inconsistency in hidden lines",
        "Slight deviation in dimension placement",
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      feedback: `Good ${drawingType} projection! Your understanding of view alignment is strong. Focus on maintaining consistent line weights and accurate dimension placements for improvement.`,
    };
    
    setResult(mockResult);
    setIsEvaluating(false);
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
              Upload your drawing to get instant AI feedback on accuracy and errors
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Reference Image */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
              <h3 className="font-mono font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Reference Image
              </h3>
              <div className="aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                {referenceImage ? (
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No reference image set</p>
                    <p className="text-xs">Admin can upload in admin panel</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
              <h3 className="font-mono font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-secondary" />
                Your Drawing
              </h3>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl bg-muted border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all overflow-hidden group"
              >
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground p-4 group-hover:text-primary transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to upload your drawing</p>
                    <p className="text-xs">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
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
              disabled={!uploadedImage || isEvaluating}
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
