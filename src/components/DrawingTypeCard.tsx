import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Box, Layers, Scissors, ArrowRight } from "lucide-react";

interface DrawingTypeCardProps {
  type: "orthographic" | "isometric" | "sectional";
  semester: number;
  delay?: number;
}

const typeConfig = {
  orthographic: {
    title: "Orthographic",
    description: "Front, Top, and Side views projection",
    icon: Box,
    gradient: "from-primary to-primary/70",
  },
  isometric: {
    title: "Isometric",
    description: "3D representation at equal angles",
    icon: Layers,
    gradient: "from-secondary to-secondary/70",
  },
  sectional: {
    title: "Sectional Orthographic",
    description: "Cross-sectional internal views",
    icon: Scissors,
    gradient: "from-accent to-accent/70",
  },
};

const DrawingTypeCard = ({ type, semester, delay = 0 }: DrawingTypeCardProps) => {
  const navigate = useNavigate();
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(`/semester/${semester}/${type}`)}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all duration-500 border border-border/50 hover:border-primary/30 h-full">
        {/* Top gradient bar */}
        <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
        
        {/* Blueprint pattern */}
        <div className="absolute inset-0 blueprint-grid opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
        
        <div className="relative p-8">
          <div className="mb-6">
            <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${config.gradient} text-primary-foreground shadow-lg`}>
              <Icon className="w-8 h-8" />
            </div>
          </div>
          
          <h3 className="font-mono text-xl md:text-2xl font-bold text-foreground mb-3">
            {config.title}
          </h3>
          
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            {config.description}
          </p>
          
          <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all duration-300">
            <span>View Content</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className={`absolute inset-0 bg-gradient-to-t ${config.gradient} opacity-5`} />
        </div>
      </div>
    </motion.div>
  );
};

export default DrawingTypeCard;
