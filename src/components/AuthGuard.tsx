import React, { useState, useEffect } from 'react';
import { 
  auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, User, db, doc, getDoc, setDoc, Timestamp 
} from '../firebase';
import { Shield, Lock, Terminal, Mail, UserPlus, LogIn, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth mode: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Password Security requirements check
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordSecure = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: u.email,
              displayName: u.displayName || u.email?.split('@')[0] || 'Operator',
              photoURL: u.photoURL,
              role: 'admin',
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

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google login failed:", error);
      setAuthError(error.message || "Google authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);

    if (!email || !password) {
      setAuthError("Please fill in all required fields.");
      return;
    }

    if (mode === 'signup') {
      if (!isPasswordSecure) {
        setAuthError("Password does not meet security requirements.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          displayName: email.split('@')[0],
          role: 'admin',
          createdAt: Timestamp.now()
        });
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setAuthMessage("Password reset email sent. Check your inbox.");
        setSubmitting(false);
        return;
      }
    } catch (error: any) {
      console.error("Auth operation failed:", error);
      let msg = error.message || "Authentication failed.";
      if (error.code === 'auth/email-already-in-use') msg = "Email address is already registered.";
      if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (error.code === 'auth/weak-password') msg = "Password is too weak.";
      setAuthError(msg);
    } finally {
      setSubmitting(false);
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
        <div className="max-w-md w-full bg-[#141414] border border-white/10 p-8 rounded-xl shadow-2xl space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-[#1a1a1a] rounded-full border border-[#00ff00]/20">
              <Shield size={48} className="text-[#00ff00]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white text-center tracking-tighter">SHADOW HARVEST</h1>
            <p className="text-gray-500 text-center text-xs mt-1">ADVANCED CTI & OSINT CORRELATION PLATFORM</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => { setMode('login'); setAuthError(null); setAuthMessage(null); }}
              className={`flex-1 py-2 rounded text-center font-bold transition-all ${mode === 'login' ? 'bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]/30' : 'text-gray-400 hover:text-white'}`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setAuthError(null); setAuthMessage(null); }}
              className={`flex-1 py-2 rounded text-center font-bold transition-all ${mode === 'signup' ? 'bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]/30' : 'text-gray-400 hover:text-white'}`}
            >
              REGISTER
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle size={16} className="shrink-0" />
              <span>{authMessage}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest">Operator Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@shadowharvest.internal"
                  className="w-full bg-black/60 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff00]"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Secure Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setAuthError(null); setAuthMessage(null); }}
                      className="text-[10px] text-[#00ffcc] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-black/60 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Password security checklist for signup */}
            {mode === 'signup' && (
              <div className="p-3 bg-black/40 rounded border border-white/5 space-y-1.5 text-[10px]">
                <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Password Security Standard:</span>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#00ff00]' : 'text-gray-500'}`}>
                  <span>{hasMinLength ? '✓' : '•'} Minimum 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase && hasLowercase ? 'text-[#00ff00]' : 'text-gray-500'}`}>
                  <span>{hasUppercase && hasLowercase ? '✓' : '•'} Uppercase & lowercase letters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#00ff00]' : 'text-gray-500'}`}>
                  <span>{hasNumber ? '✓' : '•'} At least one number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-[#00ff00]' : 'text-gray-500'}`}>
                  <span>{hasSpecial ? '✓' : '•'} At least one special character (!@#$%^&*)</span>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-black/60 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff00]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (mode === 'signup' && !isPasswordSecure)}
              className="w-full flex items-center justify-center gap-2 bg-[#00ff00] hover:bg-[#00cc00] text-black font-bold py-3 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : mode === 'signup' ? (
                <UserPlus size={16} />
              ) : mode === 'login' ? (
                <LogIn size={16} />
              ) : (
                <Mail size={16} />
              )}
              {submitting ? 'PROCESSING...' : mode === 'signup' ? 'REGISTER ACCOUNT' : mode === 'login' ? 'AUTHORIZE ACCESS' : 'SEND RESET INSTRUCTIONS'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setAuthError(null); setAuthMessage(null); }}
                className="w-full text-center text-xs text-gray-400 hover:text-white pt-2"
              >
                ← Back to Sign In
              </button>
            )}
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-[10px] uppercase">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-lg border border-white/10 transition-colors text-xs uppercase tracking-wider"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                CONTINUE WITH GOOGLE
              </button>
            </>
          )}
          
          <div className="pt-4 border-t border-white/10 text-[10px] text-gray-500 uppercase tracking-widest text-center">
            RESTRICTED ACCESS // LEVEL 4 CLEARANCE REQUIRED
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
