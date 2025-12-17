import { motion } from "framer-motion";
import { FileText, Video, Box, Brain, ArrowRight, LucideIcon, Timer } from "lucide-react";

interface ContentCardProps {
  type: "pyqs" | "videos" | "objects" | "ai-evaluation" | "ai-test";
  onClick: () => void;
  delay?: number;
}

const contentConfig: Record<string, { title: string; description: string; icon: LucideIcon; color: string }> = {
  pyqs: {
    title: "Previous Year Questions",
    description: "Practice with past examination papers",
    icon: FileText,
    color: "primary",
  },
  videos: {
    title: "Video Tutorials",
    description: "Learn through detailed video explanations",
    icon: Video,
    color: "secondary",
  },
  objects: {
    title: "3D Objects",
    description: "Interactive object references",
    icon: Box,
    color: "accent",
  },
  "ai-evaluation": {
    title: "AI Drawing Evaluation",
    description: "Get instant feedback on your drawings",
    icon: Brain,
    color: "primary",
  },
  "ai-test": {
    title: "AI Timed Test",
    description: "Take a timed drawing test with AI evaluation",
    icon: Timer,
    color: "secondary",
  },
};

const ContentCard = ({ type, onClick, delay = 0 }: ContentCardProps) => {
  const config = contentConfig[type];
  const Icon = config.icon;
  const isAI = type === "ai-evaluation" || type === "ai-test";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all duration-500 border border-border/50 hover:border-${config.color}/30 h-full ${isAI ? 'ring-2 ring-primary/20 hover:ring-primary/40' : ''}`}>
        {/* Special AI badge */}
        {isAI && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-medium animate-pulse-slow">
            AI Powered
          </div>
        )}
        
        {/* Blueprint pattern */}
        <div className="absolute inset-0 blueprint-dots opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
        
        <div className="relative p-6 md:p-8 flex flex-col h-full">
          <div className="mb-4">
            <div className={`inline-flex p-4 rounded-xl bg-${config.color}/10 text-${config.color} group-hover:bg-${config.color} group-hover:text-${config.color}-foreground transition-all duration-300 shadow-md`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>
          
          <h3 className="font-mono text-lg md:text-xl font-bold text-foreground mb-2">
            {config.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 flex-grow">
            {config.description}
          </p>
          
          <div className={`flex items-center text-${config.color} font-medium group-hover:gap-3 gap-2 transition-all duration-300 mt-auto`}>
            <span className="text-sm">{type === "ai-test" ? 'Start Test' : isAI ? 'Start Evaluation' : 'View All'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
        
        {/* Bottom accent */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${config.color} to-${config.color}/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
      </div>
    </motion.div>
  );
};

export default ContentCard;
