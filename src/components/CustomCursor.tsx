import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useSpring(mousePosition.x, { damping: 20, stiffness: 250 });
  const cursorY = useSpring(mousePosition.y, { damping: 20, stiffness: 250 });

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseover', handleHover);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseover', handleHover);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-emerald-500 pointer-events-none z-[9999] hidden md:block"
      style={{
        translateX: cursorX,
        translateY: cursorY,
        x: '-50%',
        y: '-50%',
        scale: isHovering ? 2.5 : 1,
        backgroundColor: isHovering ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 250 }}
    />
  );
}
