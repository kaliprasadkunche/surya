import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Instagram, Twitter, Facebook } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useProfile } from '../context/ProfileContext';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const { profile } = useProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const path = 'messages';
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: new Date().toISOString(),
      });
      setStatus('success');
      setFormData({ name: '', email: '', mobile: '', message: '' });
    } catch (err) {
      console.error('Firestore Client Write Error:', err);
      setStatus('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-16 px-6 min-h-screen bg-zinc-950"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div>
          <p className="text-indigo-500 font-medium tracking-widest uppercase mb-4 text-sm">Get in Touch</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 tracking-tighter leading-tight">
            Let's create <br /> <span className="italic text-fuchsia-400">Magic</span> together.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-12">
            Whether you're planning a wedding, need a cinematic portrait, or have a 
            creative project in mind, I'd love to hear from you.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Email Me</h4>
                <p className="text-zinc-400">{profile?.email || 'hello@lumina.studio'}</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Call Me</h4>
                <p className="text-zinc-400">{profile?.phone || '+1 (555) 123-4567'}</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Visit Me</h4>
                <p className="text-zinc-400">New York City, NY</p>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {profile?.instagram && (
              <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-indigo-500 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
            )}
            <a href="#" className="text-zinc-400 hover:text-indigo-500 transition-colors"><Twitter className="w-6 h-6" /></a>
            <a href="#" className="text-zinc-400 hover:text-indigo-500 transition-colors"><Facebook className="w-6 h-6" /></a>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Mobile Number</label>
              <input 
                type="tel" 
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Message</label>
              <textarea 
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none text-sm"
                placeholder="Tell me about your project..."
              />
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'sending'}
              className="w-full btn-primary py-3 flex items-center justify-center gap-3"
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
              <Send className="w-4 h-4" />
            </button>

            {status === 'success' && (
              <p className="text-indigo-400 text-center font-medium">Message sent successfully! I'll be in touch soon.</p>
            )}
            {status === 'error' && (
              <p className="text-red-400 text-center font-medium">Something went wrong. Please try again.</p>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
}
