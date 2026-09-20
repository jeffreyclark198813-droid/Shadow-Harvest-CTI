import React, { useState, useEffect, useRef } from 'react';
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
  LogOut, 
  Users, 
  Sparkles, 
  History, 
  Brain, 
  Database, 
  Network, 
  ShieldAlert, 
  ShieldCheck,
  Radio,
  RefreshCw,
  Sliders,
  ChevronDown,
  Scale,
  Bell,
  Globe
} from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { RateLimitAlert } from './RateLimitAlert';
import { useLiveMode } from '../context/LiveModeContext';

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
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showLiveIntervalPicker, setShowLiveIntervalPicker] = useState(false);
  const liveMenuRef = useRef<HTMLDivElement>(null);

  const { 
    isLiveMode, 
    toggleLiveMode, 
    refreshInterval, 
    setRefreshInterval, 
    secondsLeft, 
    isRefreshing, 
    manualRefresh 
  } = useLiveMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close live interval picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (liveMenuRef.current && !liveMenuRef.current.contains(e.target as Node)) {
        setShowLiveIntervalPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const intervals = [
    { label: '10s (High-Frequency)', value: 10 },
    { label: '15s (Tactical)', value: 15 },
    { label: '30s (Default)', value: 30 },
    { label: '60s (Balanced)', value: 60 },
    { label: '2 min (Low Resource)', value: 120 },
    { label: '5 min (Passive)', value: 300 },
  ];

  return (
    <div className="flex flex-col h-screen bg-harvest-bg text-gray-300 overflow-hidden relative">
      <AnimatePresence>
        {showGlobalSearch && (
          <GlobalSearchModal onClose={() => setShowGlobalSearch(false)} activePersonaId={persona?.id} />
        )}
      </AnimatePresence>

      {/* Top App Bar */}
      <header className="h-14 flex items-center justify-between px-3 sm:px-4 bg-harvest-card/80 backdrop-blur-md border-b border-harvest-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-harvest-accent/30 overflow-hidden bg-harvest-bg active-pulse">
            <img src={persona.avatar} alt="Persona" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-tighter leading-none">{persona.name}</h1>
            <p className="text-[8px] text-harvest-accent uppercase tracking-widest mt-0.5">Level {persona.level} Analyst</p>
          </div>
        </div>
        
        {/* Top Controls & Live Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Global Live Mode Toggle Pill */}
          <div className="relative" ref={liveMenuRef}>
            <div className={`flex items-center rounded-full border transition-all ${
              isLiveMode 
                ? 'bg-harvest-accent/10 border-harvest-accent/40 text-harvest-accent' 
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}>
              <button
                onClick={toggleLiveMode}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-tight hover:opacity-80 transition-opacity"
                title={isLiveMode ? `Live Polling Active (Interval: ${refreshInterval}s)` : "Live Polling Paused. Click to enable."}
              >
                <span className={`w-2 h-2 rounded-full ${
                  isLiveMode ? 'bg-harvest-accent animate-pulse shadow-[0_0_8px_#00ff00]' : 'bg-gray-600'
                }`} />
                <span>{isLiveMode ? `LIVE ${secondsLeft > 0 ? `${secondsLeft}s` : ''}` : 'PAUSED'}</span>
              </button>

              {/* Interval & Manual Refresh Dropdown Toggle */}
              <button
                onClick={() => setShowLiveIntervalPicker(!showLiveIntervalPicker)}
                className="px-1.5 py-1 border-l border-white/10 hover:text-white transition-colors"
                title="Configure Live Polling Interval"
              >
                <ChevronDown size={11} className={showLiveIntervalPicker ? 'rotate-180 transition-transform' : ''} />
              </button>

              <button
                onClick={manualRefresh}
                disabled={isRefreshing}
                className="pr-2 pl-1 py-1 hover:text-white transition-colors disabled:opacity-50"
                title="Trigger Manual Synchronized Refresh"
              >
                <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-harvest-accent' : ''} />
              </button>
            </div>

            {/* Configurable Interval Dropdown Menu */}
            <AnimatePresence>
              {showLiveIntervalPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-black/95 border border-harvest-accent/40 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 font-mono"
                >
                  <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase font-bold text-harvest-accent flex items-center gap-1.5">
                      <Radio size={11} />
                      POLLING CADENCE
                    </span>
                    <span className="text-[9px] text-gray-500">{refreshInterval}s active</span>
                  </div>

                  <div className="space-y-1">
                    {intervals.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setRefreshInterval(item.value);
                          setShowLiveIntervalPicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] flex items-center justify-between transition-colors ${
                          refreshInterval === item.value 
                            ? 'bg-harvest-accent/20 text-harvest-accent font-bold border border-harvest-accent/30' 
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        {refreshInterval === item.value && <span className="w-1.5 h-1.5 rounded-full bg-harvest-accent" />}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between px-2 text-[9px]">
                    <span className="text-gray-400">Master Polling:</span>
                    <button
                      onClick={() => {
                        toggleLiveMode();
                        setShowLiveIntervalPicker(false);
                      }}
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        isLiveMode ? 'text-red-400 hover:bg-red-500/10' : 'text-harvest-accent hover:bg-harvest-accent/10'
                      }`}
                    >
                      {isLiveMode ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setShowGlobalSearch(true)} 
            className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
            title="Global Search (Cmd/Ctrl + K)"
          >
            <Search size={14} />
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Shield size={10} className="text-harvest-accent" />
            <span className="text-[9px] font-bold text-white uppercase">{persona.anonymityScore?.value || 0}%</span>
          </div>

          <button onClick={onLogout} className="p-2 text-gray-500 hover:text-white transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Surface */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-20 scroll-smooth">
        {/* Global Rate Limit Alert */}
        <div className="px-4 pt-3">
          <RateLimitAlert />
        </div>
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
      <nav className="h-16 flex items-center justify-around bg-harvest-card/90 backdrop-blur-lg border-t border-harvest-border fixed bottom-0 left-0 right-0 z-50 overflow-x-auto no-scrollbar">
        {[
          { id: 'targets', icon: TargetIcon, label: 'Targets' },
          { id: 'dcoip', icon: ShieldCheck, label: 'DCOIP-X' },
          { id: 'ipasngraph', icon: Globe, label: 'IP-ASN Map' },
          { id: 'reconsolidation', icon: Scale, label: 'Reconsolidation' },
          { id: 'alerts', icon: Bell, label: 'Alerts' },
          { id: 'temporal', icon: History, label: 'Temporal' },
          { id: 'inference', icon: Brain, label: 'Inference' },
          { id: 'registry', icon: Database, label: 'Registry' },
          { id: 'personas', icon: Network, label: 'SNA & ID' },
          { id: 'threats', icon: ShieldAlert, label: 'Threats' },
          { id: 'anonymization', icon: ShieldCheck, label: 'Redact' },
          { id: 'bulk', icon: Search, label: 'Bulk Scan'},
          { id: 'activity', icon: BarChart3, label: 'CTI Ops' },
          { id: 'restoration', icon: Sparkles, label: 'Restore' },
          { id: 'monitor', icon: Activity, label: 'Live Fed' },
          { id: 'workspace', icon: Users, label: 'Collab' },
          { id: 'settings', icon: Settings, label: 'Profile' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] px-2 transition-all relative ${
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
            <span className="text-[9px] uppercase font-bold tracking-tighter truncate max-w-[68px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

