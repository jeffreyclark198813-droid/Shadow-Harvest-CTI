import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target as TargetIcon, 
  Activity, 
  Settings, 
  BookOpen, 
  Search,
  Plus,
  BarChart3,
  Menu,
  Shield,
  Zap,
  LogOut
} from 'lucide-react';

interface AndroidLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddClick: () => void;
  persona: any;
  onLogout: () => void;
}

export const AndroidLayout: React.FC<AndroidLayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onAddClick,
  persona,
  onLogout
}) => {
  return (
    <div className="flex flex-col h-screen bg-harvest-bg text-gray-300 overflow-hidden relative">
      {/* Top App Bar */}
      <header className="h-14 flex items-center justify-between px-4 bg-harvest-card/80 backdrop-blur-md border-b border-harvest-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-harvest-accent/30 overflow-hidden bg-harvest-bg active-pulse">
            <img src={persona.avatar} alt="Persona" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-tighter leading-none">{persona.name}</h1>
            <p className="text-[8px] text-harvest-accent uppercase tracking-widest mt-0.5">Level {persona.level} Analyst</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Shield size={10} className="text-harvest-accent" />
            <span className="text-[9px] font-bold text-white uppercase">{persona.anonymityScore.value}%</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-500 hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Surface */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-20 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="p-4 min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB - Android style */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddClick}
        className="fixed bottom-20 right-4 w-14 h-14 bg-harvest-accent text-black rounded-2xl shadow-harvest-glow 
                   flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </motion.button>

      {/* Navigation Rail / Bottom Nav */}
      <nav className="h-16 flex items-center justify-around bg-harvest-card/90 backdrop-blur-lg border-t border-harvest-border fixed bottom-0 left-0 right-0 z-50">
        {[
          { id: 'targets', icon: TargetIcon, label: 'Targets' },
          { id: 'activity', icon: BarChart3, label: 'CTI Ops' },
          { id: 'monitor', icon: Activity, label: 'Live Fed' },
          { id: 'library', icon: BookOpen, label: 'Library' },
          { id: 'settings', icon: Settings, label: 'Profile' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all relative ${
              activeTab === item.id ? 'text-harvest-accent' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-bg"
                className="absolute inset-0 bg-harvest-accent/10 rounded-xl"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <item.icon size={20} className={activeTab === item.id ? 'text-harvest-accent' : ''} />
            <span className="text-[9px] uppercase font-bold tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
