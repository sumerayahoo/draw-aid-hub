import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";

interface SemesterCardProps {
  semester: number;
  delay?: number;
}

const SemesterCard = ({ semester, delay = 0 }: SemesterCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={() => navigate(`/semester/${semester}`)}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all duration-500 border border-border/50 hover:border-primary/30">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Blueprint grid pattern */}
        <div className="absolute inset-0 blueprint-dots opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
        
        <div className="relative p-8 md:p-10">
          <div className="flex items-start justify-between mb-6">
            <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <BookOpen className="w-8 h-8" />
            </div>
            <span className="font-mono text-6xl font-bold text-muted-foreground/20 group-hover:text-primary/20 transition-colors duration-300">
              0{semester}
            </span>
          </div>
          
          <h3 className="font-mono text-2xl md:text-3xl font-bold text-foreground mb-3">
            Semester {semester}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            Engineering Drawing fundamentals and technical visualization
          </p>
          
          <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all duration-300">
            <span>Explore Modules</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </div>
    </motion.div>
  );
};

export default SemesterCard;
