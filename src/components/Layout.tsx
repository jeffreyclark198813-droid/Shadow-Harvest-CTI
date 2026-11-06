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
  Globe,
  X
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const liveMenuRef = useRef<HTMLDivElement>(null);
  const sidebarLiveMenuRef = useRef<HTMLDivElement>(null);
  const [showSidebarLivePicker, setShowSidebarLivePicker] = useState(false);

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

  // Close live interval pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (liveMenuRef.current && !liveMenuRef.current.contains(e.target as Node)) {
        setShowLiveIntervalPicker(false);
      }
      if (sidebarLiveMenuRef.current && !sidebarLiveMenuRef.current.contains(e.target as Node)) {
        setShowSidebarLivePicker(false);
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

  // Grouped category structure for high-fidelity sidebar and collapsible drawers
  const categories = [
    {
      title: 'Operational CTI',
      items: [
        { id: 'targets', icon: TargetIcon, label: 'Monitored Assets' },
        { id: 'bulk', icon: Search, label: 'Bulk Scanner' },
        { id: 'activity', icon: BarChart3, label: 'CTI Ops Hub' },
        { id: 'workspace', icon: Users, label: 'Collab Workspace' },
      ]
    },
    {
      title: 'Mapping & Topology',
      items: [
        { id: 'ipasngraph', icon: Globe, label: 'IP-ASN Map' },
        { id: 'dcoip', icon: ShieldCheck, label: 'DCOIP-X Decrypt' },
        { id: 'reconsolidation', icon: Scale, label: 'GovSec Recon' },
      ]
    },
    {
      title: 'Intelligence Engines',
      items: [
        { id: 'temporal', icon: History, label: 'Temporal Drift' },
        { id: 'inference', icon: Brain, label: 'Epistemic Inference' },
        { id: 'personas', icon: Network, label: 'SNA & Identity' },
        { id: 'threats', icon: ShieldAlert, label: 'Threat Assessments' },
      ]
    },
    {
      title: 'Control Plane (DAER)',
      items: [
        { id: 'federated-search', icon: Search, label: 'Federated Search' },
        { id: 'daer', icon: Database, label: 'DAER Controls' },
        { id: 'authority', icon: Scale, label: 'IAMLaw Policies' },
        { id: 'registry', icon: Database, label: 'Source Registry' },
      ]
    },
    {
      title: 'Security & Systems',
      items: [
        { id: 'alerts', icon: Bell, label: 'Alerts Center' },
        { id: 'monitor', icon: Activity, label: 'Live Ingestion' },
        { id: 'anonymization', icon: ShieldCheck, label: 'Data Redaction' },
        { id: 'governance', icon: Shield, label: 'Security Gov' },
        { id: 'settings', icon: Settings, label: 'Profile & Settings' },
        { id: 'restoration', icon: Sparkles, label: 'Restore Baseline' },
      ]
    }
  ];

  // Flattened array for quick lookups
  const allNavItems = categories.flatMap(cat => cat.items);

  // Mobile Bottom Bar Navigation Contract (Maximum 5 items for ergonomic reachability)
  const mobileNavItems = [
    { id: 'targets', icon: TargetIcon, label: 'Targets' },
    { id: 'ipasngraph', icon: Globe, label: 'Map' },
    { id: 'monitor', icon: Activity, label: 'Live Fed' },
    { id: 'governance', icon: Shield, label: 'Security' },
  ];

  return (
    <div className="flex h-screen bg-harvest-bg text-gray-300 overflow-hidden relative font-sans antialiased">
      <AnimatePresence>
        {showGlobalSearch && (
          <GlobalSearchModal onClose={() => setShowGlobalSearch(false)} activePersonaId={persona?.id} />
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 1. DESKTOP/TABLET SIDE NAVIGATION RAIL     */}
      {/* ========================================== */}
      <aside className="hidden md:flex flex-col w-72 bg-harvest-card border-r border-harvest-border h-full relative z-40 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-harvest-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-harvest-accent/10 border border-harvest-accent/40 flex items-center justify-center">
              <Zap size={12} className="text-harvest-accent animate-pulse" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">
              Shadow Harvest
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-harvest-accent/10 border border-harvest-accent/30 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-harvest-accent animate-ping" />
            <span className="text-[9px] font-mono font-bold text-harvest-accent uppercase tracking-tighter">
              v2.4
            </span>
          </div>
        </div>

        {/* Analyst Profile HUD Section */}
        <div className="p-5 border-b border-harvest-border/50 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-harvest-accent/30 overflow-hidden bg-harvest-bg active-pulse">
              <img src={persona.avatar} alt="Persona" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold text-white uppercase tracking-tight truncate leading-none mb-1">
                {persona.name}
              </h2>
              <div className="flex items-center gap-1 text-[8px] text-harvest-accent uppercase font-semibold tracking-wider">
                <Shield size={8} />
                <span>Level {persona.level} Analyst</span>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="p-1.5 text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg border border-transparent hover:border-harvest-border/30"
              title="Terminate Session"
            >
              <LogOut size={13} />
            </button>
          </div>

          {/* Core Telemetry Indicators inside Sidebar */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-black/40 border border-harvest-border/50 rounded-xl">
              <span className="mono-label !text-[7px] block">Op Anonymity</span>
              <span className="text-xs font-bold font-mono text-white flex items-center justify-center gap-1 mt-0.5">
                <Shield size={10} className="text-harvest-accent" />
                {persona.anonymityScore?.value || 0}%
              </span>
            </div>
            <div className="p-2 bg-black/40 border border-harvest-border/50 rounded-xl cursor-pointer hover:border-harvest-accent/30 transition-all relative"
                 ref={sidebarLiveMenuRef}
                 onClick={() => setShowSidebarLivePicker(!showSidebarLivePicker)}>
              <span className="mono-label !text-[7px] block">Live Polling</span>
              <span className="text-xs font-bold font-mono text-harvest-accent flex items-center justify-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-harvest-accent animate-pulse shadow-[0_0_8px_#00ff00]' : 'bg-gray-600'}`} />
                {isLiveMode ? `${secondsLeft > 0 ? `${secondsLeft}s` : 'SYNC'}` : 'PAUSED'}
              </span>

              {/* Sidebar Polling Dropdown */}
              <AnimatePresence>
                {showSidebarLivePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-black border border-harvest-accent/40 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl z-50 text-left font-mono"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {intervals.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setRefreshInterval(item.value);
                          setShowSidebarLivePicker(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[8px] flex items-center justify-between transition-colors mb-0.5 ${
                          refreshInterval === item.value 
                            ? 'bg-harvest-accent/10 text-harvest-accent font-bold' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <div className="border-t border-white/10 mt-1 pt-1 flex justify-between px-1 text-[8px]">
                      <button onClick={toggleLiveMode} className="text-harvest-accent uppercase font-bold text-[7px]">
                        {isLiveMode ? 'Pause' : 'Activate'}
                      </button>
                      <button onClick={manualRefresh} className="text-gray-400 uppercase font-bold text-[7px] flex items-center gap-1">
                        <RefreshCw size={8} className={isRefreshing ? 'animate-spin' : ''} />
                        Sync Now
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Categories Sidenav Inset Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {categories.map((category) => (
            <div key={category.title} className="space-y-1">
              <h3 className="mono-label px-3 mb-1 text-gray-600 !text-[8px]">
                {category.title}
              </h3>
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const isCurrent = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all relative ${
                        isCurrent 
                          ? 'text-harvest-accent font-semibold bg-harvest-accent/5 border border-harvest-accent/15' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] border border-transparent'
                      }`}
                    >
                      <item.icon size={15} className={isCurrent ? 'text-harvest-accent' : 'text-gray-600'} />
                      <span className="text-[11px] uppercase tracking-tight">{item.label}</span>
                      {isCurrent && (
                        <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-harvest-accent shadow-[0_0_8px_#00ff00]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidenav Footer Actions */}
        <div className="p-4 border-t border-harvest-border bg-black/20 flex gap-2">
          <button 
            onClick={() => setShowGlobalSearch(true)}
            className="flex-1 py-2 px-3 bg-white/5 border border-harvest-border hover:border-harvest-accent/30 rounded-xl text-[9px] font-bold text-gray-400 hover:text-white font-mono flex items-center justify-center gap-1.5 transition-all"
          >
            <Search size={11} />
            <span>SEARCH (⌘K)</span>
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 2. MAIN VIEWPORT & MOBILE INTERFACES       */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Top App Bar (Visible on md:hidden only) */}
        <header className="md:hidden h-14 flex items-center justify-between px-3 sm:px-4 bg-harvest-card/80 backdrop-blur-md border-b border-harvest-border sticky top-0 z-50 shrink-0">
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
            {/* Mobile Live Mode Toggle */}
            <div className="relative" ref={liveMenuRef}>
              <div className={`flex items-center rounded-full border transition-all ${
                isLiveMode 
                  ? 'bg-harvest-accent/10 border-harvest-accent/40 text-harvest-accent' 
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}>
                <button
                  onClick={toggleLiveMode}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-tight hover:opacity-80 transition-opacity"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isLiveMode ? 'bg-harvest-accent animate-pulse shadow-[0_0_8px_#00ff00]' : 'bg-gray-600'
                  }`} />
                  <span>{isLiveMode ? `LIVE ${secondsLeft > 0 ? `${secondsLeft}s` : ''}` : 'PAUSED'}</span>
                </button>

                <button
                  onClick={() => setShowLiveIntervalPicker(!showLiveIntervalPicker)}
                  className="px-1.5 py-1 border-l border-white/10 hover:text-white transition-colors"
                >
                  <ChevronDown size={11} className={showLiveIntervalPicker ? 'rotate-180 transition-transform' : ''} />
                </button>
              </div>

              <AnimatePresence>
                {showLiveIntervalPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-black border border-harvest-accent/40 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl z-50 font-mono"
                  >
                    {intervals.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setRefreshInterval(item.value);
                          setShowLiveIntervalPicker(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[9px] flex items-center justify-between transition-colors ${
                          refreshInterval === item.value 
                            ? 'bg-harvest-accent/10 text-harvest-accent font-bold' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowGlobalSearch(true)} 
              className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
            >
              <Search size={14} />
            </button>
            
            <button onClick={onLogout} className="p-2 text-gray-500 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Global Rate Limit HUD Alert */}
        <div className="px-4 pt-3 shrink-0">
          <RateLimitAlert />
        </div>

        {/* Core Main Scroll Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-20 md:pb-6 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="p-4 min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ========================================== */}
        {/* 3. FLOATING ACTION BUTTON (ERGONOMIC FAB)   */}
        {/* ========================================== */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onAddClick}
          className="fixed bottom-20 md:bottom-6 right-4 w-14 h-14 bg-harvest-accent text-black rounded-2xl shadow-harvest-glow 
                     flex items-center justify-center z-40 cursor-pointer border-none"
          title="Initialize New Target Mission"
        >
          <Plus size={26} />
        </motion.button>

        {/* ========================================== */}
        {/* 4. MOBILE BOTTOM TAB NAVIGATION BAR        */}
        {/* ========================================== */}
        <nav className="md:hidden h-16 flex items-center justify-around bg-harvest-card/90 backdrop-blur-lg border-t border-harvest-border fixed bottom-0 left-0 right-0 z-50">
          {mobileNavItems.map((item) => {
            const isCurrent = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setShowMoreMenu(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 min-w-[64px] px-2 h-full transition-all relative ${
                  isCurrent ? 'text-harvest-accent' : 'text-gray-500'
                }`}
              >
                {isCurrent && (
                  <motion.div 
                    layoutId="nav-bg-mobile"
                    className="absolute inset-x-1.5 inset-y-1 bg-harvest-accent/5 rounded-xl border border-harvest-accent/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon size={19} className={isCurrent ? 'text-harvest-accent' : ''} />
                <span className="text-[9px] uppercase font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
          
          {/* More Drawer Button Trigger */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] px-2 h-full transition-all relative ${
              showMoreMenu ? 'text-harvest-accent' : 'text-gray-500'
            }`}
          >
            <Menu size={19} />
            <span className="text-[9px] uppercase font-bold tracking-tight">More</span>
          </button>
        </nav>
      </div>

      {/* ========================================== */}
      {/* 5. GORGEOUS MOBILE BOTTOM SLIDE-UP DRAWER  */}
      {/* ========================================== */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Semi-transparent Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Smooth Spring Sliding Drawer Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="md:hidden fixed bottom-0 left-0 right-0 max-h-[75vh] bg-harvest-card border-t border-harvest-border rounded-t-[32px] shadow-2xl z-[101] flex flex-col safe-p-bottom"
            >
              {/* Central Swipe Handle Affordance */}
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto my-3 shrink-0" />
              
              {/* Drawer Title */}
              <div className="px-6 pb-2 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Operational Console</h3>
                  <p className="text-[8px] text-gray-500 font-mono mt-0.5">SELECT DESTINATION INTERFACE</p>
                </div>
                <button 
                  onClick={() => setShowMoreMenu(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable list of categories and items */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {categories.map((category) => (
                  <div key={category.title} className="space-y-1.5">
                    <h4 className="mono-label !text-[8px] text-gray-600 border-b border-harvest-border/30 pb-1">
                      {category.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.items.map((item) => {
                        const isCurrent = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setShowMoreMenu(false);
                            }}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left border ${
                              isCurrent 
                                ? 'bg-harvest-accent/10 border-harvest-accent/30 text-harvest-accent font-semibold' 
                                : 'bg-black/30 border-harvest-border/50 text-gray-400 hover:text-white'
                            }`}
                            style={{ minHeight: '44px' }} // Ergonomic mobile touch target
                          >
                            <item.icon size={14} className={isCurrent ? 'text-harvest-accent' : 'text-gray-500'} />
                            <span className="text-[10px] uppercase tracking-tight truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
