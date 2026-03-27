import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, LogOut, Plus, Image as ImageIcon, Film, CheckCircle, AlertCircle, Loader2, MessageSquare, Calendar, Mail, User, Settings, Instagram, Phone, Globe } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { mediaService, authService, contactService, profileService } from '../services/api';
import { Media, ContactMessage, Profile } from '../types';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const DEFAULT_PROFILE: Profile = {
  name: 'Julian Lumina',
  email: 'contact@julianlumina.com',
  tagline: 'Capturing the soul of moments.',
  description: 'Fine Art Photographer based in Paris.',
  myStory: '',
  skills: [],
  equipment: [],
  updatedAt: new Date().toISOString()
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'media' | 'messages' | 'settings'>('media');
  const [media, setMedia] = useState<Media[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [newMedia, setNewMedia] = useState({ title: '', description: '', category: 'Wedding', type: 'image' });
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'media') {
        const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Media));
        setMedia(data);
      } else if (activeTab === 'messages') {
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as ContactMessage));
        setMessages(data);
      } else if (activeTab === 'settings') {
        const q = query(collection(db, 'profile'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setProfile({ _id: snapshot.docs[0].id, ...docData } as Profile);
        } else {
          setProfile(DEFAULT_PROFILE);
        }
      }
    } catch (err) {
      console.error('Error fetching data from Firestore:', err);
      // Fallback to API if Firestore client fails (might happen if not logged in via Google)
      try {
        if (activeTab === 'media') {
          const data = await mediaService.getAll();
          setMedia(Array.isArray(data) ? data : []);
        } else if (activeTab === 'messages') {
          const data = await contactService.getAll();
          setMessages(Array.isArray(data) ? data : []);
        } else if (activeTab === 'settings') {
          const data = await profileService.get();
          setProfile(data || DEFAULT_PROFILE);
        }
      } catch (apiErr) {
        console.error('API Fallback failed:', apiErr);
        if (activeTab === 'media') setMedia([]);
        else if (activeTab === 'messages') setMessages([]);
        else if (activeTab === 'settings') setProfile(DEFAULT_PROFILE);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingLogo(true);
    setStatus(null);
    try {
      const { url } = await profileService.uploadLogo(file);
      const updatedProfile = { ...profile, logoUrl: url };
      setProfile(updatedProfile);
      
      // Also update Firestore immediately if we have an ID
      if (profile._id) {
        const { _id, ...profileData } = updatedProfile;
        await setDoc(doc(db, 'profile', _id), { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        // Check if a profile already exists
        const q = query(collection(db, 'profile'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const { _id, ...profileData } = updatedProfile;
          await setDoc(doc(db, 'profile', snapshot.docs[0].id), { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
      
      setStatus({ type: 'success', message: 'Logo uploaded and saved successfully!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Logo upload failed.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingProfilePic(true);
    setStatus(null);
    try {
      const { url } = await profileService.uploadProfilePic(file);
      const updatedProfile = { ...profile, profilePicUrl: url };
      setProfile(updatedProfile);
      
      // Also update Firestore immediately if we have an ID
      if (profile._id) {
        const { _id, ...profileData } = updatedProfile;
        await setDoc(doc(db, 'profile', _id), { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        // Check if a profile already exists
        const q = query(collection(db, 'profile'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const { _id, ...profileData } = updatedProfile;
          await setDoc(doc(db, 'profile', snapshot.docs[0].id), { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
      
      setStatus({ type: 'success', message: 'Profile picture uploaded and saved successfully!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Profile picture upload failed.' });
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setStatus(null);
    try {
      const { _id, ...profileData } = profile;
      const updateData = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      if (_id) {
        await setDoc(doc(db, 'profile', _id), updateData, { merge: true });
      } else {
        // Check if a profile already exists
        const q = query(collection(db, 'profile'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await setDoc(doc(db, 'profile', snapshot.docs[0].id), updateData, { merge: true });
        } else {
          await addDoc(collection(db, 'profile'), updateData);
        }
      }
      
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      fetchData();
    } catch (err: any) {
      console.error('Firestore update failed:', err);
      // Fallback to API
      try {
        await profileService.update(profile);
        setStatus({ type: 'success', message: 'Profile updated successfully (via API)!' });
        fetchData();
      } catch (apiErr: any) {
        console.error('API update failed:', apiErr);
        setStatus({ 
          type: 'error', 
          message: apiErr.message || 'Failed to update profile. Please ensure you are signed in with Google.' 
        });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    if (acceptedFiles.length > 0) {
      const isVideo = acceptedFiles[0].type.startsWith('video');
      setNewMedia(prev => ({ ...prev, type: isVideo ? 'video' : 'image' }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov']
    }
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const formData = new FormData();
      formData.append('file', f);
      
      // If title is provided, use it with index for multiple files, otherwise use filename
      const displayTitle = files.length > 1 
        ? (newMedia.title ? `${newMedia.title} (${i + 1})` : f.name.split('.')[0])
        : (newMedia.title || f.name.split('.')[0]);

      formData.append('title', displayTitle);
      formData.append('description', newMedia.description);
      formData.append('category', newMedia.category);
      formData.append('type', f.type.startsWith('video') ? 'video' : 'image');

      try {
        const response = await mediaService.upload(formData);
        
        // If backend failed to write to Firestore, try client-side
        if (response.firestoreError) {
          try {
            const { _id, firestoreError, ...mediaData } = response;
            await addDoc(collection(db, 'media'), mediaData);
          } catch (clientFirestoreErr) {
            console.error('Client-side Firestore write failed:', clientFirestoreErr);
          }
        }
        successCount++;
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err) {
        console.error(`Upload failed for ${f.name}:`, err);
      }
    }

    if (successCount > 0) {
      setStatus({ type: 'success', message: `${successCount} masterpiece(s) published successfully!` });
    } else {
      setStatus({ type: 'error', message: 'Upload failed. Please check your credentials.' });
    }

    setShowUploadModal(false);
    setFiles([]);
    setNewMedia({ title: '', description: '', category: 'Wedding', type: 'image' });
    fetchData();
    setUploading(false);
    setUploadProgress(0);
  };

  const handleUpdateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia || !editingMedia._id) return;

    setSavingProfile(true);
    try {
      const mediaRef = doc(db, 'media', editingMedia._id);
      const updateData = {
        title: editingMedia.title,
        description: editingMedia.description,
        category: editingMedia.category,
        updatedAt: new Date().toISOString()
      };

      await setDoc(mediaRef, updateData, { merge: true });
      
      setMedia(prev => prev.map(m => m._id === editingMedia._id ? { ...m, ...updateData } : m));
      setEditingMedia(null);
      setStatus({ type: 'success', message: 'Media updated successfully' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error('Error updating media:', err);
      setStatus({ type: 'error', message: 'Failed to update media' });
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    setStatus(null);
    try {
      // First delete from Firestore via client SDK
      await deleteDoc(doc(db, 'media', id));
      
      // Then call API to delete from Cloudinary
      try {
        await mediaService.delete(id);
      } catch (apiErr) {
        console.warn('Cloudinary deletion via API failed or Firestore already deleted:', apiErr);
      }
      
      setMedia(media.filter(m => m._id !== id));
      setStatus({ type: 'success', message: 'Masterpiece deleted successfully!' });
    } catch (err) {
      console.error('Firestore delete failed:', err);
      // Fallback to API
      try {
        await mediaService.delete(id);
        setMedia(media.filter(m => m._id !== id));
        setStatus({ type: 'success', message: 'Masterpiece deleted successfully (via API)!' });
      } catch (apiErr) {
        console.error('API delete failed:', apiErr);
        setStatus({ type: 'error', message: 'Delete failed. Please ensure you are signed in with Google.' });
      }
    }
  };

  const handleDeleteMessage = async (id: string) => {
    setStatus(null);
    try {
      await deleteDoc(doc(db, 'messages', id));
      setMessages(messages.filter(m => m._id !== id));
      setStatus({ type: 'success', message: 'Message deleted successfully!' });
    } catch (err) {
      console.error('Firestore message delete failed:', err);
      // Fallback to API
      try {
        await contactService.delete(id);
        setMessages(messages.filter(m => m._id !== id));
        setStatus({ type: 'success', message: 'Message deleted successfully (via API)!' });
      } catch (apiErr) {
        console.error('API message delete failed:', apiErr);
        setStatus({ type: 'error', message: 'Delete failed. Please ensure you are signed in with Google.' });
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Dashboard</h1>
            <p className="text-zinc-500 uppercase tracking-widest text-sm">Manage Your Art & Inquiries</p>
            {!auth.currentUser && (
              <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                <AlertCircle className="w-4 h-4" />
                <span>Not signed in with Google. Some features may be restricted.</span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-4">
              <button 
                onClick={() => setActiveTab('media')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'media' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Media
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Messages
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Settings
              </button>
            </div>
            {activeTab === 'media' && (
              <button 
                onClick={() => setShowUploadModal(true)}
                className="btn-primary py-2 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Upload New
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="btn-outline py-2 flex items-center gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-8 p-4 rounded-xl flex items-center gap-3 max-w-3xl mx-auto ${
                status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{status.message}</span>
              <button onClick={() => setStatus(null)} className="ml-auto text-zinc-500 hover:text-white"><Plus className="w-4 h-4 rotate-45" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : activeTab === 'media' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl overflow-hidden group"
              >
                <div className="aspect-square relative">
                  {item.type === 'image' ? (
                    <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" />
                  )}
                  {/* Mobile visible actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 md:hidden">
                    <button 
                      onClick={() => setEditingMedia(item)}
                      className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMedia(item._id!)}
                      className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-red-400 border border-white/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] uppercase tracking-widest text-white border border-white/10">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate">{item.title}</h4>
                    <p className="text-zinc-500 text-xs truncate">{item.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => setEditingMedia(item)}
                      className="p-2 bg-white/5 hover:bg-indigo-600 rounded-lg text-zinc-400 hover:text-white transition-all"
                      title="Edit"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMedia(item._id!)}
                      className="p-2 bg-red-500/10 hover:bg-red-600 rounded-lg text-red-500 hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : activeTab === 'messages' ? (
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs">
                        <User className="w-3 h-3" /> {msg.name}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Mail className="w-3 h-3" /> {msg.email}
                      </div>
                      {msg.mobile && (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                          <Phone className="w-3 h-3" /> {msg.mobile}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <Calendar className="w-3 h-3" /> {new Date(msg.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-white leading-relaxed text-sm">{msg.message}</p>
                  </div>
                  <div className="flex items-start">
                    <button 
                      onClick={() => handleDeleteMessage(msg._id!)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-40">
                <MessageSquare className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500 text-xl font-serif italic">No inquiries received yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 md:p-8 rounded-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <Settings className="w-6 h-6 text-indigo-500" />
                <h2 className="text-2xl font-serif text-white">Profile Settings</h2>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                    <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-[0.2em] mb-4">Website Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <Globe className="w-3 h-3" /> Website Name
                        </label>
                        <input 
                          type="text" 
                          required
                          value={profile.websiteName || ''}
                          onChange={(e) => setProfile({ ...profile, websiteName: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                          placeholder="LUMINA"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <ImageIcon className="w-3 h-3" /> Logo
                        </label>
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                            {profile.logoUrl ? (
                              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-zinc-700" />
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="inline-block cursor-pointer btn-outline py-1.5 px-4 text-[10px] uppercase tracking-widest">
                              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <User className="w-3 h-3" /> Profile Picture
                        </label>
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                            {profile.profilePicUrl ? (
                              <img src={profile.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-zinc-700" />
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="inline-block cursor-pointer btn-outline py-1.5 px-4 text-[10px] uppercase tracking-widest">
                              {uploadingProfilePic ? 'Uploading...' : 'Upload Photo'}
                              <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} disabled={uploadingProfilePic} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                    <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-[0.2em] mb-4">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <User className="w-3 h-3" /> Full Name
                        </label>
                        <input 
                          type="text" 
                          required
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <Mail className="w-3 h-3" /> Email Address
                        </label>
                        <input 
                          type="email" 
                          required
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <Phone className="w-3 h-3" /> Phone Number
                        </label>
                        <input 
                          type="text" 
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <Instagram className="w-3 h-3" /> Instagram ID
                        </label>
                        <input 
                          type="text" 
                          value={profile.instagram || ''}
                          onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                          placeholder="@username"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                    <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-[0.2em] mb-4">Content & Story</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                          <Globe className="w-3 h-3" /> Tagline
                        </label>
                        <input 
                          type="text" 
                          value={profile.tagline || ''}
                          onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                          placeholder="Capturing the soul of moments."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Short Description</label>
                        <textarea 
                          rows={2}
                          value={profile.description || ''}
                          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
                          placeholder="Fine Art Photographer based in Paris."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">My Story / About Me</label>
                        <textarea 
                          rows={4}
                          value={profile.myStory || ''}
                          onChange={(e) => setProfile({ ...profile, myStory: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
                          placeholder="Tell your full story..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                    <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-[0.2em] mb-4">Expertise & Gear</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Skills (Comma separated)</label>
                        <input 
                          type="text" 
                          value={profile.skills?.join(', ') || ''}
                          onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                          placeholder="Wedding, Portrait, Fashion"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Equipment (Comma separated)</label>
                        <input 
                          type="text" 
                          value={profile.equipment?.join(', ') || ''}
                          onChange={(e) => setProfile({ ...profile, equipment: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                          placeholder="Sony A7R IV, 35mm f/1.4"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={savingProfile}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Settings'}
                  </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl glass p-6 rounded-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold text-white">Upload Masterpiece</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-zinc-500 hover:text-white"><Plus className="w-5 h-5 rotate-45" /></button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                    isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <input {...getInputProps()} />
                  {files.length > 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto p-2">
                        {files.map((f, i) => (
                          <div key={i} className="px-3 py-1 bg-white/10 rounded-full text-[10px] text-white flex items-center gap-2 border border-white/5">
                            <span className="truncate max-w-[120px]">{f.name}</span>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }} 
                              className="text-red-400 hover:text-red-300"
                            >
                              <Plus className="w-3 h-3 rotate-45" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-zinc-400 text-xs font-medium">{files.length} file(s) selected</p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setFiles([]); }} className="text-red-400 text-[10px] uppercase tracking-widest font-bold hover:underline">Clear All</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-10 h-10 text-zinc-600 mx-auto" />
                      <p className="text-zinc-400 text-sm">Drag & drop your photos or videos here, or click to browse</p>
                      <p className="text-zinc-600 text-[10px] uppercase tracking-widest">JPG, PNG, WEBP, MP4, MOV (Max 100MB per file)</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Base Title</label>
                    <input 
                      type="text" 
                      value={newMedia.title}
                      onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                      placeholder="e.g. Summer Collection"
                    />
                    <p className="text-[10px] text-zinc-500 italic">Leave empty to use filenames</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={newMedia.category}
                      onChange={(e) => setNewMedia({ ...newMedia, category: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    >
                      <option value="Wedding" className="bg-zinc-900 text-white">Wedding</option>
                      <option value="Portrait" className="bg-zinc-900 text-white">Portrait</option>
                      <option value="Events" className="bg-zinc-900 text-white">Events</option>
                      <option value="Nature" className="bg-zinc-900 text-white">Nature</option>
                      <option value="Travel" className="bg-zinc-900 text-white">Travel</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={2}
                    value={newMedia.description}
                    onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
                    placeholder="Tell the story behind this moment..."
                  />
                </div>

                {uploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
                      <span>Uploading to Cloudinary...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={uploading || files.length === 0}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {uploading ? 'Processing...' : `Publish ${files.length} Masterpiece${files.length > 1 ? 's' : ''}`}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Media Modal */}
        {editingMedia && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl glass p-6 rounded-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold text-white">Edit Masterpiece</h2>
                <button onClick={() => setEditingMedia(null)} className="text-zinc-500 hover:text-white"><Plus className="w-5 h-5 rotate-45" /></button>
              </div>

              <form onSubmit={handleUpdateMedia} className="space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10 mb-4">
                  {editingMedia.type === 'image' ? (
                    <img src={editingMedia.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <video src={editingMedia.url} className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Title</label>
                    <input 
                      type="text" 
                      required
                      value={editingMedia.title}
                      onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                      placeholder="Image Title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={editingMedia.category}
                      onChange={(e) => setEditingMedia({ ...editingMedia, category: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    >
                      <option value="Wedding" className="bg-zinc-900 text-white">Wedding</option>
                      <option value="Portrait" className="bg-zinc-900 text-white">Portrait</option>
                      <option value="Events" className="bg-zinc-900 text-white">Events</option>
                      <option value="Nature" className="bg-zinc-900 text-white">Nature</option>
                      <option value="Travel" className="bg-zinc-900 text-white">Travel</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={2}
                    value={editingMedia.description}
                    onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
                    placeholder="Tell the story behind this moment..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {savingProfile ? 'Saving...' : 'Update Media'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
