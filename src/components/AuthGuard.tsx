import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, User, db, doc, getDoc, setDoc, Timestamp } from '../firebase';
import { Shield, Lock, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              role: 'user',
              createdAt: Timestamp.now()
            });
          }
        } catch (error) {
          console.error("Error ensuring user profile:", error);
        }
      }
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono text-[#00ff00]">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <Terminal size={20} />
          <span>INITIALIZING SECURE SESSION...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-[#141414] border border-[#333] p-8 rounded-lg shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#1a1a1a] rounded-full border border-[#00ff00]/20">
              <Shield size={48} className="text-[#00ff00]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2 tracking-tighter">SHADOW HARVEST</h1>
          <p className="text-gray-500 text-center text-sm mb-8">ADVANCED CTI & OSINT CORRELATION PLATFORM</p>
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#00ff00] hover:bg-[#00cc00] text-black font-bold py-3 px-4 rounded transition-colors"
          >
            <Lock size={18} />
            AUTHORIZE WITH GOOGLE
          </button>
          
          <div className="mt-8 pt-6 border-t border-[#333] text-[10px] text-gray-600 uppercase tracking-widest text-center">
            RESTRICTED ACCESS // LEVEL 4 CLEARANCE REQUIRED
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
