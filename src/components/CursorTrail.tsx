import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

const COLORS = [
  'hsl(195, 100%, 60%)',  // Sky blue
  'hsl(210, 100%, 55%)',  // Neon blue
  'hsl(180, 100%, 50%)',  // Cyan
  'hsl(225, 80%, 55%)',   // Royal blue
  'hsl(200, 100%, 65%)',  // Light blue
];

const CursorTrail = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const throttleRef = useRef(false);

  const createParticle = useCallback((x: number, y: number) => {
    if (!containerRef.current || throttleRef.current) return;
    
    throttleRef.current = true;
    setTimeout(() => { throttleRef.current = false; }, 20);

    const particle = document.createElement('div');
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = Math.random() * 12 + 6;
    const id = particleIdRef.current++;

    particle.className = 'cursor-particle';
    particle.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color};
    `;

    containerRef.current.appendChild(particle);

    // Remove particle after animation
    setTimeout(() => {
      particle.remove();
    }, 1000);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      createParticle(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [createParticle]);

  return (
    <>
      <style>{`
        .cursor-trail-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }
        
        .cursor-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          animation: particle-fade 1s ease-out forwards;
        }
        
        @keyframes particle-fade {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
        }
      `}</style>
      <div ref={containerRef} className="cursor-trail-container" />
    </>
  );
};

export default CursorTrail;
