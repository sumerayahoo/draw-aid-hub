import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import SemesterCard from "@/components/SemesterCard";

const branchNames: Record<string, string> = {
  ce: "Computer Engineering",
  cst: "Computer Science & Technology",
  ds: "Data Science",
  ai: "Artificial Intelligence",
  enc: "Electronics & Communication",
};

const Branch = () => {
  const { branchCode } = useParams();
  const branchName = branchNames[branchCode || ""] || "Engineering";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 blueprint-grid opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-sm mb-6">
              {branchCode?.toUpperCase()}
            </div>
            
            <h1 className="font-mono text-3xl md:text-5xl font-bold mb-4">
              {branchName}
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Select your semester to access drawing modules
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="font-mono text-2xl md:text-3xl font-bold mb-2">
              Select Your Semester
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <SemesterCard semester={1} delay={0.4} />
            <SemesterCard semester={2} delay={0.5} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Branch;
