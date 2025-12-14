import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Compass } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-mono font-bold text-lg hidden sm:inline">
              DrawingHub
            </span>
          </div>
        </div>
        
        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="font-mono text-sm"
          >
            Home
          </Button>
          <Button
            variant="tech"
            size="sm"
            onClick={() => navigate("/admin")}
            className="font-mono text-sm"
          >
            Admin
          </Button>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
