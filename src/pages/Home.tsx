import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Instagram, Film, Camera, MapPin, MousePointer2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mediaService } from '../services/api';
import { Media } from '../types';
import { useProfile } from '../context/ProfileContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// --- Utility for randomization ---
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- Sub-components for different carousel styles ---

// 1. Cinematic Hero Carousel
const HeroCarousel = ({ items, profileName, tagline }: { items: Media[], profileName: string, tagline?: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={items[index]._id || index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img 
            src={items[index].url} 
            alt={items[index].title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-indigo-500 uppercase tracking-[0.4em] text-xs md:text-sm mb-4 font-medium"
        >
          {profileName} Photography
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-8 tracking-tighter leading-none"
        >
          {tagline ? (
            tagline.split(' ').map((word, i) => (
              i === 2 ? <span key={i} className="italic text-fuchsia-400 font-normal">{word} </span> : word + ' '
            ))
          ) : (
            <>Capturing <br /> <span className="italic text-fuchsia-400 font-normal">The Eternal</span></>
          )}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Link to="/portfolio" className="btn-primary group">
            Explore Portfolio <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
          <motion.div 
            animate={{ y: [0, 48] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-indigo-500"
          />
        </div>
        <span className="text-[10px] text-white/40 uppercase tracking-widest">Scroll</span>
      </div>
    </section>
  );
};

// 2. Horizontal Scroll Carousel
const HorizontalScrollCarousel = ({ items }: { items: Media[] }) => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ 
    target: targetRef,
    offset: ["start end", "end start"]
  });
  const x = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "-70%"]);

  return (
    <section ref={targetRef} className="relative h-[200vh] md:h-[300vh] bg-zinc-950">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="px-6 md:px-12 mb-20 absolute top-16 left-0 z-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Visual Journeys</h2>
          <p className="text-zinc-500 uppercase tracking-widest text-[10px] md:text-xs">Scroll to explore the timeline</p>
        </motion.div>
        <motion.div style={{ x }} className="flex gap-4 md:gap-8 px-6 md:px-12">
          {items.map((item, idx) => (
            <motion.div 
              key={item._id || idx} 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative h-[40vh] md:h-[60vh] aspect-[16/10] flex-shrink-0 group overflow-hidden rounded-2xl border border-white/5"
            >
              <img 
                src={item.url} 
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 md:p-8 flex flex-col justify-end">
                <p className="text-fuchsia-400 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">{item.category}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// 3. Masonry Carousel Gallery
const MasonryCarousel = ({ items }: { items: Media[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    // Use Intersection Observer to only scroll when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setInterval(() => {
            if (containerRef.current) {
              const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
              if (scrollLeft + clientWidth >= scrollWidth - 20) {
                containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
              } else {
                containerRef.current.scrollTo({ left: scrollLeft + clientWidth, behavior: 'smooth' });
              }
            }
          }, 5000);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPaused]);

  const scroll = (dir: 'left' | 'right') => {
    if (containerRef.current) {
      const { scrollLeft, clientWidth } = containerRef.current;
      const target = dir === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      containerRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 md:py-24 px-6 bg-zinc-900/10 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-serif text-white mb-2 tracking-tight">Artistic Fragments</h2>
          <p className="text-zinc-500 uppercase tracking-widest text-[10px] md:text-xs">A masonry perspective</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => scroll('left')} className="p-3 md:p-4 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={() => scroll('right')} className="p-3 md:p-4 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors"><ChevronRight size={20} /></button>
        </div>
      </motion.div>
      <div 
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar px-4 scroll-smooth"
      >
        {items.map((item, idx) => (
          <motion.div 
            key={item._id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className={`flex-shrink-0 rounded-2xl overflow-hidden group relative border border-white/5 ${
              idx % 3 === 0 
                ? 'w-64 md:w-80 h-[400px] md:h-[500px]' 
                : idx % 3 === 1 
                ? 'w-72 md:w-[500px] h-[300px] md:h-[400px]' 
                : 'w-64 md:w-96 h-[350px] md:h-[450px]'
            }`}
          >
            <img src={item.url} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="flex items-center justify-center gap-2 text-fuchsia-400 text-[10px] uppercase tracking-widest">
                  <MapPin className="w-3 h-3" /> {item.category}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// 4. Film Strip Carousel
const FilmStripCarousel = ({ items }: { items: Media[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setInterval(() => {
            if (containerRef.current) {
              const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
              if (scrollLeft + clientWidth >= scrollWidth - 20) {
                containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
              } else {
                containerRef.current.scrollTo({ left: scrollLeft + 300, behavior: 'smooth' });
              }
            }
          }, 3000);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPaused]);

  return (
    <section className="py-24 overflow-hidden bg-black">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 mb-12"
      >
        <div className="flex items-center gap-4 text-indigo-500 mb-4">
          <Film className="w-6 h-6" />
          <span className="uppercase tracking-[0.3em] text-[10px] font-bold">Film Reel</span>
        </div>
        <h2 className="text-4xl font-serif text-white tracking-tighter">Cinematic Frames</h2>
      </motion.div>
      <div 
        ref={containerRef} 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-4 px-4 overflow-x-auto hide-scrollbar py-10 scroll-smooth"
      >
        {items.map((item, idx) => (
          <motion.div 
            key={item._id || idx}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className="film-strip-frame flex-shrink-0 w-72 aspect-[3/4] group cursor-pointer"
          >
            <img src={item.url} loading="lazy" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// 5. Floating Card Carousel
const FloatingCardCarousel = ({ items }: { items: Media[] }) => {
  const [active, setActive] = useState(2);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % Math.min(items.length, 5));
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  return (
    <section className="py-16 md:py-24 bg-zinc-950 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12 md:mb-20 px-6"
      >
        <h2 className="text-2xl md:text-4xl font-serif text-white mb-4 tracking-tighter">The Highlight Gallery</h2>
        <div className="w-20 h-[1px] bg-indigo-500 mx-auto opacity-50" />
      </motion.div>
      <div 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative h-[400px] md:h-[600px] flex items-center justify-center"
      >
        {items.slice(0, 5).map((item, idx) => {
          const offset = idx - active;
          const isCenter = offset === 0;
          return (
            <motion.div
              key={item._id || idx}
              initial={false}
              animate={{
                x: offset * (window.innerWidth < 768 ? 180 : 320),
                scale: isCenter ? 1 : 0.8,
                opacity: Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.3,
                zIndex: 10 - Math.abs(offset),
              }}
              onClick={() => setActive(idx)}
              className="absolute w-[280px] md:w-[400px] h-[380px] md:h-[550px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer border border-white/5"
            >
              <img src={item.url} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {isCenter && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-6 md:p-10 flex flex-col justify-end">
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

// 6. Vertical Scroll Carousel
const VerticalScrollCarousel = ({ items }: { items: Media[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setInterval(() => {
            if (containerRef.current) {
              const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
              if (scrollTop + clientHeight >= scrollHeight - 20) {
                containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                containerRef.current.scrollTo({ top: scrollTop + clientHeight, behavior: 'smooth' });
              }
            }
          }, 5000);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPaused]);

  return (
    <section className="h-screen flex flex-col md:flex-row bg-black overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="w-full md:w-1/3 flex flex-col justify-center px-12 md:px-20 py-20 bg-zinc-950"
      >
        <p className="text-indigo-500 uppercase tracking-widest text-[10px] mb-4 font-bold">Portraits</p>
        <h2 className="text-4xl md:text-6xl font-serif text-white mb-6 tracking-tighter leading-none">Vertical <br />Essence</h2>
        <p className="text-zinc-500 leading-relaxed font-light">Capturing the soul through portraiture. A vertical exploration of human emotion and character in its purest form.</p>
      </motion.div>
      <div 
        ref={containerRef} 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="w-full md:w-2/3 h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar scroll-smooth"
      >
        {items.map((item, idx) => (
          <div key={item._id || idx} className="h-full w-full snap-start relative group">
            <img src={item.url} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors duration-1000" />
            <div className="absolute bottom-20 left-12 md:left-20">
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// 7. Overlapping Carousel
const OverlappingCarousel = ({ items }: { items: Media[] }) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % Math.min(items.length, 3));
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  return (
    <section className="py-40 bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-20">
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="w-full md:w-1/2 relative h-[600px]"
        >
          {items.slice(0, 3).map((item, idx) => {
            const isActive = idx === index;
            return (
              <motion.div
                key={item._id || idx}
                animate={{
                  x: idx * 40,
                  y: idx * 40,
                  zIndex: isActive ? 10 : 5 - idx,
                  scale: isActive ? 1 : 0.95,
                  filter: isActive ? "blur(0px)" : "blur(8px)",
                  opacity: isActive ? 1 : 0.4
                }}
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-white/5"
              >
                <img src={item.url} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>
            );
          })}
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 tracking-tighter leading-none">Layered <br />Perspectives</h2>
          <p className="text-zinc-500 text-lg mb-12 leading-relaxed font-light">Depth is not just in the lens, but in the story. Our layered approach brings multiple dimensions to every frame, inviting you to look deeper.</p>
          <div className="flex gap-4">
            {items.slice(0, 3).map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setIndex(idx)}
                className={`w-12 h-1 bg-white/10 rounded-full transition-all duration-500 ${index === idx ? 'bg-indigo-500 w-20' : 'hover:bg-white/20'}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// 8. Category Carousel
const CategoryCarousel = ({ items, title }: { items: Media[], title: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setInterval(() => {
            if (containerRef.current) {
              const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
              if (scrollLeft + clientWidth >= scrollWidth - 20) {
                containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
              } else {
                containerRef.current.scrollTo({ left: scrollLeft + 350, behavior: 'smooth' });
              }
            }
          }, 4000);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPaused]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-24 last:mb-0"
    >
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-2xl font-serif text-white tracking-tight">{title}</h3>
        <Link to="/portfolio" className="text-indigo-500 text-[10px] uppercase tracking-[0.3em] font-bold hover:text-indigo-400 transition-colors">View All</Link>
      </div>
      <div 
        ref={containerRef} 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 scroll-smooth"
      >
        {items.map((item, idx) => (
          <motion.div 
            key={item._id || idx}
            whileHover={{ scale: 1.02 }}
            className="flex-shrink-0 w-80 aspect-[4/5] rounded-2xl overflow-hidden relative group cursor-pointer border border-white/5"
          >
            <img src={item.url} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end">
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// 9. Instagram Style Photo Carousel
const InstagramStyleGrid = ({ items }: { items: Media[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setInterval(() => {
            if (containerRef.current) {
              const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
              if (scrollLeft + clientWidth >= scrollWidth - 20) {
                containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
              } else {
                containerRef.current.scrollTo({ left: scrollLeft + 250, behavior: 'smooth' });
              }
            }
          }, 3500);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPaused]);

  return (
    <section className="py-32 bg-zinc-900/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 mb-12"
        >
          <Instagram className="w-6 h-6 text-indigo-500" />
          <h2 className="text-3xl font-serif text-white tracking-tight">Social Moments</h2>
        </motion.div>
        <div 
          ref={containerRef} 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-auto hide-scrollbar pb-8 scroll-smooth"
        >
          {items.slice(0, 12).map((item, idx) => (
            <motion.div 
              key={item._id || idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99, 102, 241, 0.2)" }}
              className="w-64 aspect-square flex-shrink-0 rounded-xl overflow-hidden border border-white/5 relative group"
            >
              <img src={item.url} loading="lazy" className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 border border-indigo-500/0 group-hover:border-indigo-500/30 transition-colors rounded-xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 10. Cinematic Showcase Carousel
const CinematicShowcase = ({ items }: { items: Media[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <section className="relative h-screen bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={items[index]?._id || index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img src={items[index]?.url} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12">
        <button onClick={() => setIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))} className="p-4 md:p-6 text-white/30 hover:text-white transition-colors"><ChevronLeft size={32} /></button>
        <div className="text-center max-w-4xl px-6">
        </div>
        <button onClick={() => setIndex((prev) => (prev + 1) % items.length)} className="p-4 md:p-6 text-white/30 hover:text-white transition-colors"><ChevronRight size={32} /></button>
      </div>
    </section>
  );
};

// 11. Infinite Photo Carousel
const InfiniteMarquee = ({ items }: { items: Media[] }) => {
  return (
    <section className="py-24 bg-black overflow-hidden border-y border-white/5">
      <div className="marquee-content">
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={`${item._id || idx}-${idx}`} className="w-80 aspect-video rounded-xl overflow-hidden flex-shrink-0 border border-white/5 group">
            <img src={item.url} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    </section>
  );
};

// --- Main Home Component ---

export default function Home() {
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);

  const heroItems = useMemo(() => shuffleArray(allMedia).slice(0, 8), [allMedia]);
  const horizontalItems = useMemo(() => shuffleArray(allMedia), [allMedia]);
  const masonryItems = useMemo(() => shuffleArray(allMedia), [allMedia]);
  const filmItems = useMemo(() => shuffleArray(allMedia), [allMedia]);
  const floatingItems = useMemo(() => shuffleArray(allMedia), [allMedia]);
  const verticalItems = useMemo(() => shuffleArray(allMedia).slice(0, 10), [allMedia]);
  const overlappingItems = useMemo(() => shuffleArray(allMedia).slice(0, 5), [allMedia]);
  const instagramItems = useMemo(() => shuffleArray(allMedia), [allMedia]);
  const showcaseItems = useMemo(() => shuffleArray(allMedia).slice(0, 8), [allMedia]);
  const marqueeItems = useMemo(() => shuffleArray(allMedia), [allMedia]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Media));
        setAllMedia(data);
      } catch (err) {
        console.error('Error fetching media from Firestore:', err);
        // Fallback to API
        try {
          const mediaData = await mediaService.getAll();
          if (Array.isArray(mediaData)) {
            setAllMedia(mediaData);
          }
        } catch (apiErr) {
          console.error('API Fallback failed:', apiErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || profileLoading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Camera className="w-12 h-12 text-indigo-500" />
          </motion.div>
          <p className="text-zinc-500 uppercase tracking-[0.5em] text-[10px] font-bold animate-pulse">Developing Masterpieces...</p>
        </div>
      </div>
    );
  }

  // Only display uploaded media
  const displayMedia = allMedia;

  const categories = Array.from(new Set(displayMedia.map(m => m.category)));
  const photographerName = profile?.name || 'Julian Lumina';
  const brandName = profile?.websiteName || photographerName;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-zinc-950"
    >
      {/* 1. Cinematic Hero Carousel */}
      <HeroCarousel items={heroItems} profileName={brandName} tagline={profile?.tagline} />

      {/* 2. Horizontal Scroll Carousel */}
      <HorizontalScrollCarousel items={horizontalItems} />

      {/* 3. Masonry Carousel Gallery */}
      <MasonryCarousel items={masonryItems} />

      {/* 4. Film Strip Carousel */}
      <FilmStripCarousel items={filmItems} />

      {/* 5. Floating Card Carousel */}
      <FloatingCardCarousel items={floatingItems} />

      {/* 6. Vertical Scroll Carousel */}
      <VerticalScrollCarousel items={verticalItems} />

      {/* 7. Overlapping Carousel */}
      <OverlappingCarousel items={overlappingItems} />

      {/* 8. Category Carousel */}
      <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16 md:mb-24">
          <p className="text-indigo-500 font-medium tracking-widest uppercase mb-4 text-[10px] md:text-xs font-bold">The Collections</p>
          <h2 className="text-3xl md:text-6xl font-serif text-white tracking-tighter">Curated Stories</h2>
        </div>
        {categories.map(cat => (
          <CategoryCarousel key={cat} title={cat} items={shuffleArray(displayMedia.filter(m => m.category === cat))} />
        ))}
      </section>

      {/* 9. Instagram Style Photo Carousel */}
      <InstagramStyleGrid items={instagramItems} />

      {/* 10. Cinematic Showcase Carousel */}
      <CinematicShowcase items={showcaseItems} />

      {/* 11. Infinite Photo Carousel */}
      <InfiniteMarquee items={marqueeItems} />

      {displayMedia.length === 0 && (
        <div className="py-20 text-center px-6">
          <Camera className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-white mb-4">No Masterpieces Yet</h2>
          <p className="text-zinc-500 max-w-md mx-auto italic">
            We are currently curating our latest works. Please check back soon to see our updated portfolio.
          </p>
          <Link to="/portfolio" className="btn-outline mt-8 inline-block">View Full Gallery</Link>
        </div>
      )}

      {/* 12. Final Hero Image Section */}
      <section className="relative h-[70vh] md:h-screen w-full overflow-hidden flex items-center justify-center">
        {displayMedia.length > 0 && (
          <img 
            src={displayMedia[0].url} 
            className="absolute inset-0 w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl md:text-7xl font-serif text-white mb-8 md:mb-12 max-w-5xl mx-auto leading-tight tracking-tighter"
          >
            Ready to capture your <br /><span className="italic text-fuchsia-400 font-normal">next masterpiece?</span>
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-col md:flex-row justify-center gap-4 md:gap-6"
          >
            <Link to="/portfolio" className="btn-primary text-sm md:text-base px-6 md:px-10 py-3 md:py-4">View Portfolio</Link>
            <Link to="/contact" className="btn-outline text-sm md:text-base px-6 md:px-10 py-3 md:py-4">Book a Session</Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
