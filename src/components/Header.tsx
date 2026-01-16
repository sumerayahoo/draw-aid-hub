import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Compass, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { email, branch, isLoggedIn, logout, isLoading } = useStudentAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getBranchLabel = (branchValue: string) => {
    const branches: Record<string, string> = {
      computer_engineering: "Computer Engineering",
      cst: "Computer Science and Technology",
      data_science: "Data Science",
      ai: "Artificial Intelligence",
      ece: "Electronics and Communication",
    };
    return branches[branchValue] || branchValue;
  };

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
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="font-mono text-sm"
          >
            Home
          </Button>
          
          {!isLoading && isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="tech" size="sm" className="font-mono text-sm gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{email.split("@")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{email}</p>
                    <p className="text-xs text-muted-foreground">{getBranchLabel(branch)}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/student-dashboard")} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !isLoading ? (
            <Button
              variant="tech"
              size="sm"
              onClick={() => navigate("/student-login")}
              className="font-mono text-sm"
            >
              Student Login
            </Button>
          ) : null}
          
          <Button
            variant="outline"
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
