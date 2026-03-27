import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import VideoGallery from './pages/Videos';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { authService } from './services/api';
import CustomCursor from './components/CustomCursor';
import ErrorBoundary from './components/ErrorBoundary';
import { Camera } from 'lucide-react';
import { ProfileProvider } from './context/ProfileContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/admin/login" />;
};

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-20 h-20 flex items-center justify-center mb-6"
        >
          <Camera className="w-16 h-16 text-white" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <p className="text-indigo-400 font-medium tracking-[0.5em] text-[10px] uppercase">Photography Studio</p>
        </motion.div>
        
        {/* Loading Bar */}
        <motion.div 
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/10 overflow-hidden"
        >
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-full h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <ProfileProvider>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-400">
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-cyan-600/5 rounded-full blur-[100px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_70%)]" />
          </div>
          <div className="film-grain" />
          <AnimatePresence mode="wait">
            {loading && (
              <SplashScreen key="splash" onComplete={() => setLoading(false)} />
            )}
          </AnimatePresence>
          
          {!loading && (
            <>
              <CustomCursor />
              <Navbar />
              <main>
                <ErrorBoundary>
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="/videos" element={<VideoGallery />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route 
                        path="/admin/dashboard" 
                        element={
                          <PrivateRoute>
                            <AdminDashboard />
                          </PrivateRoute>
                        } 
                      />
                    </Routes>
                  </AnimatePresence>
                </ErrorBoundary>
              </main>
            </>
          )}
        </div>
      </ProfileProvider>
    </Router>
  );
}
