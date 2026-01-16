import { motion } from "framer-motion";
import { Compass, Pencil, Ruler, Triangle, PenTool, Proportions } from "lucide-react";

const FloatingTools = () => {
  const tools = [
    { Icon: Compass, position: "top-24 right-[12%]", size: "w-10 h-10", delay: 0, duration: 6 },
    { Icon: Ruler, position: "top-40 left-[8%]", size: "w-8 h-8", delay: 1, duration: 5 },
    { Icon: Pencil, position: "bottom-32 right-[18%]", size: "w-7 h-7", delay: 0.5, duration: 7 },
    { Icon: Triangle, position: "bottom-48 left-[15%]", size: "w-9 h-9", delay: 1.5, duration: 5.5 },
    { Icon: PenTool, position: "top-1/3 right-[8%]", size: "w-6 h-6", delay: 2, duration: 6.5 },
    { Icon: Proportions, position: "top-1/2 left-[5%]", size: "w-8 h-8", delay: 0.8, duration: 5.8 },
  ];

  return (
    <>
      {tools.map(({ Icon, position, size, delay, duration }, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: delay * 0.3 },
            scale: { duration: 0.5, delay: delay * 0.3 },
            y: { duration, repeat: Infinity, ease: "easeInOut", delay },
            rotate: { duration: duration * 1.2, repeat: Infinity, ease: "easeInOut", delay },
          }}
          className={`absolute ${position} hidden lg:flex items-center justify-center`}
        >
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10">
            <Icon className={`${size} text-primary/70`} />
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default FloatingTools;
