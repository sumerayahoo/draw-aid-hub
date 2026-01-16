import { Compass, Heart } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative border-t border-border/50 bg-gradient-to-b from-card/30 to-card/80 backdrop-blur-sm overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 blueprint-dots opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />
      
      <div className="relative container mx-auto px-4 py-10">
        {/* Main footer content */}
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground shadow-lg shadow-primary/20">
              <Compass className="w-6 h-6" />
            </div>
            <span className="font-mono font-bold text-xl gradient-text">DrawingHub</span>
          </motion.div>
          
          {/* Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-center max-w-md"
          >
            Your complete platform for mastering engineering drawing with AI-powered learning
          </motion.p>
          
          {/* Made by credit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="pt-4"
          >
            <h2 className="font-mono text-xl md:text-2xl font-bold text-center flex items-center gap-2 justify-center">
              <span className="text-muted-foreground">Made with</span>
              <Heart className="w-5 h-5 text-destructive fill-destructive animate-pulse" />
              <span className="text-muted-foreground">by</span>
              <span className="gradient-text">Sumera Feroz</span>
            </h2>
          </motion.div>
          
          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          {/* Copyright */}
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground/60"
          >
            © {new Date().getFullYear()} DrawingHub. All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
