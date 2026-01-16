import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Compass, BookOpen, Brain, Sparkles, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden flex-grow">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 blueprint-grid opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/15 via-secondary/10 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/15 via-accent/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        
        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 right-[15%] w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/10 hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 left-[10%] w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 backdrop-blur-sm border border-secondary/10 hidden lg:block"
        />
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 text-primary font-mono text-sm mb-8 border border-primary/20 shadow-lg shadow-primary/5"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Platform</span>
            </motion.div>
            
            {/* Main heading */}
            <h1 className="font-mono text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="text-foreground">Master </span>
              <span className="gradient-text">Engineering Drawing</span>
              <br />
              <span className="text-foreground">with Confidence</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your complete resource for engineering drawing education. Access tutorials, 
              practice with previous year questions, and get{" "}
              <span className="text-primary font-medium">AI-powered feedback</span> on your work.
            </p>
          </motion.div>
          
          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mb-20"
          >
            {[
              { icon: BookOpen, text: "PYQ Papers", color: "from-primary to-primary/70" },
              { icon: Compass, text: "Video Tutorials", color: "from-secondary to-secondary/70" },
              { icon: Brain, text: "AI Evaluation", color: "from-accent to-accent/70" },
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                  <item.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-medium text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Branch Selection */}
      <section className="relative py-16 bg-gradient-to-b from-transparent via-muted/30 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-mono text-2xl md:text-4xl font-bold mb-3">
              Select Your <span className="gradient-text">Branch</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose your engineering branch to get started
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 max-w-6xl mx-auto">
            {[
              { code: "CE", name: "Computer Engineering", gradient: "from-blue-500 to-cyan-500" },
              { code: "CST", name: "Computer Science & Technology", gradient: "from-purple-500 to-pink-500" },
              { code: "DS", name: "Data Science", gradient: "from-green-500 to-emerald-500" },
              { code: "AI", name: "Artificial Intelligence", gradient: "from-orange-500 to-amber-500" },
              { code: "ENC", name: "Electronics & Communication", gradient: "from-rose-500 to-red-500" },
            ].map((branch, index) => (
              <motion.div
                key={branch.code}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/branch/${branch.code.toLowerCase()}`)}
                className="group relative cursor-pointer"
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${branch.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                
                {/* Card */}
                <div className="relative h-40 md:h-44 p-5 md:p-6 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all duration-300 flex flex-col items-center justify-center gap-4 shadow-lg hover:shadow-xl">
                  {/* Icon */}
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${branch.gradient} flex items-center justify-center text-white font-mono font-bold text-lg md:text-xl shadow-lg group-hover:shadow-xl transition-shadow`}>
                    {branch.code}
                  </div>
                  
                  {/* Name */}
                  <h3 className="font-mono font-semibold text-xs md:text-sm text-center text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {branch.name}
                  </h3>
                  
                  {/* Arrow indicator */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;