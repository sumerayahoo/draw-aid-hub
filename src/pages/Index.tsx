import { motion } from "framer-motion";
import Header from "@/components/Header";
import SemesterCard from "@/components/SemesterCard";
import { Compass, BookOpen, Brain } from "lucide-react";

const Index = () => {
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

      {/* Semester Selection */}
      <section className="relative">
        <div className="container mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="font-mono text-2xl md:text-3xl font-bold mb-2">
              Select Your Semester
            </h2>
            <p className="text-muted-foreground">
              Choose a semester to explore drawing modules
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <SemesterCard semester={1} delay={0.4} />
            <SemesterCard semester={2} delay={0.5} />
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
