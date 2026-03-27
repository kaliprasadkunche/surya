import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BeforeAfterSliderProps {
  before: string;
  after: string;
}

export default function BeforeAfterSlider({ before, after }: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(position, 0), 100));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-3xl overflow-hidden cursor-ew-resize group select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After Image (Background) */}
      <img 
        src={after} 
        alt="After" 
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      
      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img 
          src={before} 
          alt="Before" 
          className="absolute inset-0 w-full h-full object-cover grayscale"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-white z-20"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-zinc-950 rounded-full" />
            <div className="w-1 h-3 bg-zinc-950 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-6 left-6 z-30 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white text-xs uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Original
      </div>
      <div className="absolute bottom-6 right-6 z-30 px-4 py-2 bg-emerald-600/60 backdrop-blur-md rounded-full text-white text-xs uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Edited
      </div>
    </div>
  );
}
