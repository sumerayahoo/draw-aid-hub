import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import DrawingTypeCard from "@/components/DrawingTypeCard";

const Semester = () => {
  const { semesterId } = useParams<{ semesterId: string }>();
  const semester = parseInt(semesterId || "1");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        {/* Background */}
        <div className="absolute inset-0 blueprint-dots opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-mono text-sm mb-4">
              Semester {semester}
            </span>
            <h1 className="font-mono text-3xl md:text-4xl font-bold mb-3">
              Drawing Types
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select a drawing type to access tutorials, practice questions, and AI evaluation
            </p>
          </motion.div>
          
          {/* Drawing Type Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <DrawingTypeCard type="orthographic" semester={semester} delay={0.1} />
            <DrawingTypeCard type="isometric" semester={semester} delay={0.2} />
            <DrawingTypeCard type="sectional" semester={semester} delay={0.3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Semester;
