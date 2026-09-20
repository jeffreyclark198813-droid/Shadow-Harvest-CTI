import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { ThemeProvider } from './components/ThemeProvider';
import { SystemShield } from './components/SystemShield';
import { Toaster } from './components/Toaster';
import { SupportAndFeedback } from './components/SupportAndFeedback';
import { LiveModeProvider } from './context/LiveModeContext';
import { subscribeToUserPersonas, subscribeToUserSettings, UserPersona, UserSettings } from './services/dbService';
import { auth } from './firebase';
import { Loader2 } from 'lucide-react';
import { useAPIHealthCheck } from './hooks/useAPIHealthCheck';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const TargetView = lazy(() => import('./components/TargetView').then(module => ({ default: module.TargetView })));
const Methodology = lazy(() => import('./components/Methodology').then(module => ({ default: module.Methodology })));
const CharacterCreation = lazy(() => import('./components/CharacterCreation').then(module => ({ default: module.CharacterCreation })));

export default function App() {
  useAPIHealthCheck();
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubSettings = subscribeToUserSettings(user.uid, (s) => {
      setSettings(s);
    });

    const unsubPersonas = subscribeToUserPersonas(user.uid, (p) => {
      setPersonas(p);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubPersonas();
    };
  }, [user]);

  const activePersona = personas.find(p => p.id === settings?.activePersonaId) || personas[0];

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-[#00ff00] font-mono">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-[10px] uppercase tracking-widest">Synchronizing Neural Link...</p>
        </div>
      </div>
    );
  }

  if (user && personas.length === 0) {
    return (
      <Suspense fallback={
        <div className="h-screen bg-black flex items-center justify-center text-[#00ff00] font-mono">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }>
        <CharacterCreation onComplete={() => setLoading(true)} />
      </Suspense>
    );
  }

  return (
    <ThemeProvider>
      <SystemShield>
        <AuthGuard>
          <LiveModeProvider>
            <Router>
              <Toaster />
              <SupportAndFeedback />
              <Suspense fallback={
                <div className="h-screen bg-black flex items-center justify-center text-[#00ff00] font-mono">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Dashboard activePersona={activePersona} personas={personas} settings={settings} />} />
                  <Route path="/target/:id" element={<TargetView activePersona={activePersona} settings={settings} />} />
                  <Route path="/methodology" element={<Methodology />} />
                </Routes>
              </Suspense>
            </Router>
          </LiveModeProvider>
        </AuthGuard>
      </SystemShield>
    </ThemeProvider>
  );
}
