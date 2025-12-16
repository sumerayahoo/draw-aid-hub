import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Compass, BookOpen, Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 blueprint-grid opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-sm mb-6 animate-pulse-slow">
              <Compass className="w-4 h-4" />
              Engineering Drawing Platform
            </div>
            
            <h1 className="font-mono text-4xl md:text-6xl font-bold mb-6">
              Master <span className="gradient-text">Technical Drawing</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your complete resource for engineering drawing education. Access tutorials, 
              practice with previous year questions, and get AI-powered feedback on your work.
            </p>
          </motion.div>
          
          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            {[
              { icon: BookOpen, text: "PYQ Papers" },
              { icon: Compass, text: "Video Tutorials" },
              { icon: Brain, text: "AI Evaluation" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm"
              >
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Branch Selection */}
      <section className="relative">
        <div className="container mx-auto px-4 pb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="font-mono text-2xl md:text-3xl font-bold mb-2">
              Select Your Branch
            </h2>
            <p className="text-muted-foreground">
              Choose your engineering branch
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { code: "CE", name: "Computer Engineering" },
              { code: "CST", name: "Computer Science & Technology" },
              { code: "DS", name: "Data Science" },
              { code: "AI", name: "Artificial Intelligence" },
              { code: "ENC", name: "Electronics & Communication" },
            ].map((branch, index) => (
              <motion.div
                key={branch.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/branch/${branch.code.toLowerCase()}`)}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-32 md:h-36 p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-mono font-bold text-sm md:text-base">
                    {branch.code}
                  </div>
                  <h3 className="font-mono font-semibold text-xs md:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {branch.name}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold">DrawingHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Engineering Drawing Learning Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
