import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaService } from '../services/api';
import { Media } from '../types';
import PhotoAlbum from 'react-photo-album';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useProfile } from '../context/ProfileContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const categories = ['All', 'Wedding', 'Portrait', 'Events', 'Nature', 'Travel'];

export default function Portfolio() {
  const [media, setMedia] = useState<Media[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [index, setIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'media'), where('type', '==', 'image'));
        
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Media));
        
        // Filter by category in memory if needed (or keep the where clause if it's simple)
        if (activeCategory !== 'All') {
          data = data.filter(m => m.category === activeCategory);
        }

        // Sort in memory to avoid composite index requirement
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setMedia(data);
      } catch (err) {
        console.error('Error fetching media from Firestore:', err);
        // Fallback to API
        try {
          const data = await mediaService.getAll('image', activeCategory);
          setMedia(Array.isArray(data) ? data : []);
        } catch (apiErr) {
          console.error('API Fallback failed:', apiErr);
          setMedia([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [activeCategory]);

  const photos = media.map(m => ({
    src: m.url,
    width: 1200, // Default width
    height: 1600, // Default height
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-16 px-6 min-h-screen bg-zinc-950"
    >
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <p className="text-indigo-500 font-medium tracking-widest uppercase mb-4 text-sm">Our Gallery</p>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tighter">The Portfolio</h1>
        <p className="signature text-fuchsia-500/40 text-2xl">Curated by {profile?.name || 'Julian Lumina'}</p>
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="aspect-[3/4] bg-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((item, idx) => (
              <motion.div
                key={item._id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                onClick={() => setIndex(idx)}
                className="aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group relative border border-white/5"
              >
                <img 
                  src={item.url} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-zinc-400 text-xs uppercase tracking-widest">{item.category}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40">
            <p className="text-zinc-500 text-xl font-serif italic">No masterpieces found in this category yet.</p>
          </div>
        )}
      </div>

      <Lightbox
        index={index}
        slides={photos}
        open={index >= 0}
        close={() => setIndex(-1)}
      />
    </motion.div>
  );
}
