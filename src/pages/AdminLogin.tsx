import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Camera, LogIn } from 'lucide-react';
import { authService } from '../services/api';
import { signInWithGoogle } from '../firebase';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.login({ username, password });
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      if (user.email === 'kaliprasadkunche@gmail.com') {
        // Also log in to the backend if needed, or just navigate
        // For now, we'll just navigate if the email matches
        // In a real app, you'd want to verify this on the backend too
        localStorage.setItem('admin_token', 'google-auth-session'); // Use correct key
        localStorage.setItem('admin_user', JSON.stringify({ username: user.displayName || 'Admin' }));
        navigate('/admin/dashboard');
      } else {
        setError('Unauthorized email address.');
      }
    } catch (err) {
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-zinc-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/20">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Lumina Photography Studio</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center font-medium">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-3 text-base shadow-xl shadow-indigo-600/20"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#0a0a0a] px-4 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-3 flex items-center justify-center gap-3 text-sm text-white transition-all"
          >
            <LogIn className="w-4 h-4 text-indigo-400" />
            Sign in with Google
          </button>
        </form>
      </motion.div>
    </div>
  );
}
