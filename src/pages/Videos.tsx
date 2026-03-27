import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Film, X } from 'lucide-react';
import { mediaService } from '../services/api';
import { Media } from '../types';
import { useProfile } from '../context/ProfileContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function VideoGallery() {
  const [videos, setVideos] = useState<Media[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'media'), where('type', '==', 'video'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Media));
        
        // Sort in memory to avoid composite index requirement
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setVideos(data);
      } catch (err) {
        console.error('Error fetching videos from Firestore:', err);
        // Fallback to API
        try {
          const data = await mediaService.getAll('video');
          setVideos(Array.isArray(data) ? data : []);
        } catch (apiErr) {
          console.error('API Fallback failed:', apiErr);
          setVideos([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-16 px-6 min-h-screen bg-zinc-950"
    >
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <p className="text-indigo-500 font-medium tracking-widest uppercase mb-4 text-sm">Cinematography</p>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tighter">Video Stories</h1>
        <p className="signature text-fuchsia-500/40 text-2xl mb-8 text-center">Directed by {profile?.name || 'Julian Lumina'}</p>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Moving images that tell a deeper story. From cinematic wedding highlights 
          to immersive travel documentaries.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="aspect-video bg-zinc-900 rounded-2xl animate-pulse" />
          ))
        ) : videos.length > 0 ? (
          videos.map((video, idx) => (
            <motion.div
              key={video._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group relative aspect-video overflow-hidden rounded-2xl cursor-pointer bg-zinc-900"
              onClick={() => setSelectedVideo(video)}
            >
              <video 
                src={video.url} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                muted
                loop
                onMouseOver={(e) => e.currentTarget.play()}
                onMouseOut={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-indigo-600/40">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-fuchsia-400 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Film className="w-3 h-3" /> {video.category}
                </p>
                <h4 className="text-white text-xl font-serif font-bold">{video.title}</h4>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-40">
            <p className="text-zinc-500 text-xl font-serif italic">No cinematic stories uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
          <button 
            onClick={() => setSelectedVideo(null)}
            className="absolute top-8 right-8 text-white hover:text-indigo-500 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <video 
              src={selectedVideo.url} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
