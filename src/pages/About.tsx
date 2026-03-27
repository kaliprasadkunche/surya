import { motion } from 'framer-motion';
import { Camera, Award, Star, Heart, MapPin, Mail, Instagram, Twitter } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export default function About() {
  const { profile } = useProfile();

  const photographerName = profile?.name || 'Julian Lumina';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-16 bg-zinc-950"
    >
      {/* Hero Section */}
      <section className="px-6 mb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="aspect-[4/5] rounded-2xl overflow-hidden relative z-10"
            >
              <img 
                src={profile?.profilePicUrl || "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=1000"} 
                alt="Photographer" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl -z-10" />
            
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -right-6 glass p-6 rounded-xl z-20 hidden md:block"
            >
              <p className="text-fuchsia-400 signature text-3xl mb-2">"Art is the soul of life."</p>
              <p className="text-zinc-400 text-sm uppercase tracking-widest">— {photographerName}</p>
            </motion.div>
          </div>

          <div>
            <p className="text-indigo-500 font-medium tracking-widest uppercase mb-4 text-sm">The Artist</p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 tracking-tighter leading-tight">
              {profile?.tagline?.split(' ').map((word, i) => (
                i === 2 ? <span key={i} className="italic text-fuchsia-400">{word} </span> : word + ' '
              )) || (
                <>Capturing life's <br /> <span className="italic text-fuchsia-400">Purest</span> moments.</>
              )}
            </h1>
            <div className="text-zinc-400 text-lg leading-relaxed mb-12 space-y-6">
              {profile?.myStory ? (
                profile.myStory.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <>
                  <p>
                    {profile?.description || "My journey behind the lens began over a decade ago. Since then, I've dedicated my life to capturing the raw, unscripted beauty of the human experience. Whether it's the quiet intimacy of a wedding vow or the majestic silence of a mountain peak, I strive to create images that resonate with the soul."}
                  </p>
                  <p>
                    I believe that photography is more than just a technical skill—it's a 
                    way of seeing the world. It's about finding the extraordinary in the 
                    ordinary and preserving it for generations to come.
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Based in NYC</h4>
                  <p className="text-zinc-500 text-sm">Available Worldwide</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Passionate</h4>
                  <p className="text-zinc-500 text-sm">About Storytelling</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment & Skills */}
      <section className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-3xl font-serif font-bold text-white mb-12">My Arsenal</h2>
            <div className="space-y-6">
              {profile?.equipment && profile.equipment.length > 0 ? (
                profile.equipment.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 glass rounded-xl">
                    <div>
                      <h4 className="text-white font-bold">{item}</h4>
                      <p className="text-zinc-500 text-sm">Professional Gear</p>
                    </div>
                    <Camera className="w-5 h-5 text-indigo-500/50" />
                  </div>
                ))
              ) : (
                [
                  { name: 'Sony A7R V', desc: 'Primary Body for High Resolution' },
                  { name: 'Sony A7S III', desc: 'Cinematic Video Specialist' },
                  { name: '35mm f/1.4 G-Master', desc: 'The Storyteller Lens' },
                  { name: '85mm f/1.2 G-Master', desc: 'The Portrait Master' },
                  { name: 'DJI Mavic 3 Pro', desc: 'Aerial Perspectives' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 glass rounded-xl">
                    <div>
                      <h4 className="text-white font-bold">{item.name}</h4>
                      <p className="text-zinc-500 text-sm">{item.desc}</p>
                    </div>
                    <Camera className="w-5 h-5 text-indigo-500/50" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-serif font-bold text-white mb-12">Expertise</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <div key={idx} className="p-6 glass rounded-xl text-center">
                    <Star className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
                    <h4 className="text-white font-bold mb-1">{skill}</h4>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest">Specialization</p>
                  </div>
                ))
              ) : (
                [
                  { title: 'Best Wedding Photographer', year: '2024', org: 'Vogue Weddings' },
                  { title: 'Travel Photo of the Year', year: '2023', org: 'Nat Geo' },
                  { title: 'Top 10 Portrait Artists', year: '2022', org: 'LensCulture' },
                  { title: 'Excellence in Cinematography', year: '2024', org: 'Indie Film Fest' },
                ].map((award, idx) => (
                  <div key={idx} className="p-6 glass rounded-xl text-center">
                    <Award className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
                    <h4 className="text-white font-bold mb-1">{award.title}</h4>
                    <p className="text-fuchsia-400 text-sm mb-2">{award.year}</p>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest">{award.org}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
