import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { 
  Terminal, Activity, Database, Search, Target as TargetIcon, 
  Plus, ChevronRight, BarChart3, ShieldAlert, LogOut, BookOpen,
  User, Zap, Shield, Cpu, Lock, Globe, Filter, SlidersHorizontal, Trash, X, Star, Binary
} from 'lucide-react';
import { Target, subscribeToTargets, createTarget, deleteTarget, updateTargetPriority, UserPersona, UserSettings, incrementUserStat, unlockAchievement } from '../services/dbService';
import { UserPersonaManager } from './UserPersonaManager';
import { CTIOpsDashboard } from './CTIOpsDashboard';
import { IntelligenceLibrary } from './IntelligenceLibrary';
import { BulkScannerView } from './BulkScannerView';
import { IntelligenceRestorationView } from './IntelligenceRestorationView';
import { AndroidLayout } from './Layout';
import { SystemSettings } from './SystemSettings';
import { UserProfileView } from './UserProfileView';
import { QuickScanModal } from './QuickScanModal';
import { CorrelationHeatmap } from './CorrelationHeatmap';
import { CollaborativeWorkspace } from './CollaborativeWorkspace';
import { AtomicContextViewer } from './AtomicContextViewer';
import { telemetryService } from '../services/telemetryService';
import { ReliabilityMetric } from '../types/atomic';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  activePersona: UserPersona;
  personas: UserPersona[];
  settings: UserSettings | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ activePersona, personas, settings }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('targets');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [quickScanTarget, setQuickScanTarget] = useState<Target | null>(null);
  const [newTarget, setNewTarget] = useState({ name: '', type: 'domain' as any, status: 'pending' as any });
  const [telemetry, setTelemetry] = useState<ReliabilityMetric[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = telemetryService.subscribe(setTelemetry);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('dwi_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !activePersona) return;
    
    const unsubTargets = subscribeToTargets(user.uid, activePersona.id || null, (data) => {
      setTargets(data);
      setLoading(false);
    });

    return () => {
      unsubTargets();
    };
  }, [activePersona]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const updated = [searchTerm.trim(), ...recentSearches.filter(s => s.toLowerCase() !== searchTerm.trim().toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('dwi_recent_searches', JSON.stringify(updated));
      setShowSearchHistory(false);
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('dwi_recent_searches', JSON.stringify(updated));
  };

  const handleDeleteTarget = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this target?")) {
      await deleteTarget(id);
    }
  };

  const handleTogglePriority = async (e: React.MouseEvent, target: Target) => {
    e.stopPropagation();
    if (!target.id) return;
    await updateTargetPriority(target.id, !target.isPriorityAsset);
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !activePersona) return;

    await createTarget({
      name: newTarget.name,
      type: newTarget.type,
      status: newTarget.status,
      confidenceScore: 0,
      createdBy: user.uid,
      userPersonaId: activePersona.id!
    });
    
    incrementUserStat(user.uid, 'actionsTaken');
    unlockAchievement(user.uid, 'first_op');

    setIsAdding(false);
    setNewTarget({ name: '', type: 'domain', status: 'pending' });
  };

  const filteredTargets = targets.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                        (filterType === 'priority' ? t.isPriorityAsset : t.type === filterType);
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'targets':
        return (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-3 relative">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text"
                  placeholder="SEARCH INTELLIGENCE DATABASE..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSearchHistory(true)}
                  onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                  onKeyDown={handleSearchKeyPress}
                  className="w-full bg-harvest-card border border-harvest-border rounded-2xl px-12 py-3 text-sm 
                             focus:border-harvest-accent/50 focus:bg-white/[0.02] outline-none transition-all uppercase tracking-widest"
                />
              </div>
              
              <AnimatePresence>
                {showSearchHistory && recentSearches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-12 left-0 right-0 bg-harvest-card border border-harvest-border rounded-xl shadow-2xl z-10 overflow-hidden"
                  >
                    {recentSearches.map((term, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => { setSearchTerm(term); setShowSearchHistory(false); }}
                        className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer text-sm font-mono text-gray-400 group"
                      >
                        <div className="flex items-center gap-3">
                          <Search size={14} className="text-gray-600" />
                          <span>{term}</span>
                        </div>
                        <button 
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex bg-harvest-card rounded-full border border-harvest-border p-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'priority', label: 'Priority' },
                    { id: 'domain', label: 'Domains' },
                    { id: 'persona', label: 'Personas' },
                    { id: 'wallet', label: 'Wallets' },
                    { id: 'ip', label: 'IPs' },
                    { id: 'telemetry', label: 'Telemetry' },
                  ].map(chip => (
                    <button
                      key={chip.id}
                      onClick={() => chip.id === 'telemetry' ? setActiveTab('telemetry') : setFilterType(chip.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        (filterType === chip.id || (chip.id === 'telemetry' && (activeTab as string) === 'telemetry'))
                          ? 'bg-harvest-accent text-black' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex bg-harvest-card rounded-full border border-harvest-border p-1 ml-auto shrink-0">
                  {[
                    { id: 'all', label: 'Status' },
                    { id: 'active', label: 'Active' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'archived', label: 'Archived' },
                  ].map(chip => (
                    <button
                      key={chip.id}
                      onClick={() => setFilterStatus(chip.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        filterStatus === chip.id 
                          ? 'bg-white text-black' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Correlation Heatmap */}
            <div className="mb-6">
              <CorrelationHeatmap targets={targets} />
            </div>

            {/* Target Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="mono-label text-gray-400 flex items-center gap-2">
                  <TargetIcon size={12} className="text-harvest-accent" />
                  PRIORITY ASSETS ({filteredTargets.length})
                </h2>
                <button className="p-1 px-2 bg-harvest-card rounded border border-harvest-border text-[9px] font-bold text-gray-500 flex items-center gap-1">
                  <SlidersHorizontal size={10} />
                  SORT
                </button>
              </div>

              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 hardware-surface animate-pulse" />
                ))
              ) : filteredTargets.length > 0 ? (
                filteredTargets.map((target) => (
                  <motion.div
                    key={target.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/target/${target.id}`)}
                    className="hardware-surface p-4 flex items-center justify-between group active:bg-white/5 cursor-pointer relative overflow-hidden"
                  >
                    {target.status === 'active' && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-harvest-accent shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
                    )}
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        target.status === 'active' ? 'bg-harvest-accent/10' : 'bg-gray-800/30'
                      }`}>
                        {target.type === 'domain' && <Globe size={20} className={target.status === 'active' ? 'text-harvest-accent' : 'text-gray-500'} />}
                        {target.type === 'persona' && <User size={20} className={target.status === 'active' ? 'text-harvest-accent' : 'text-gray-500'} />}
                        {target.type === 'wallet' && <Zap size={20} className={target.status === 'active' ? 'text-harvest-accent' : 'text-gray-500'} />}
                        {target.type === 'ip' && <Cpu size={20} className={target.status === 'active' ? 'text-harvest-accent' : 'text-gray-500'} />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-harvest-accent transition-colors">{target.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="mono-label !text-[9px]">{target.type}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-700" />
                          <span className={`text-[9px] font-bold uppercase tracking-tighter ${
                            target.status === 'active' ? 'text-harvest-accent' : 'text-gray-600'
                          }`}>{target.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="text-right">
                        <p className="text-[10px] font-mono font-bold text-harvest-accent">{target.confidenceScore || 0}%</p>
                        <p className="mono-label !text-[8px]">Confidence</p>
                      </div>
                      <button
                        onClick={(e) => handleTogglePriority(e, target)}
                        className={`p-2 transition-all border border-transparent rounded ${
                          target.isPriorityAsset 
                            ? 'text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400/30 opacity-100' 
                            : 'text-gray-500 hover:bg-black/50 hover:text-yellow-400 hover:border-yellow-400/30 opacity-0 group-hover:opacity-100'
                        }`}
                        title={target.isPriorityAsset ? "Remove Priority Status" : "Mark as Priority Asset"}
                      >
                        <Star size={16} fill={target.isPriorityAsset ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickScanTarget(target);
                        }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-black/50 hover:text-harvest-accent rounded text-gray-500 transition-all border border-transparent hover:border-harvest-accent/30"
                        title="Quick Scan"
                      >
                        <Search size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteTarget(e, target.id as string)}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-black/50 hover:text-red-500 rounded text-gray-500 transition-all border border-transparent hover:border-red-500/30"
                        title="Delete Target"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 hardware-surface text-center bg-transparent border-dashed">
                  <Database size={32} className="mx-auto text-gray-700 mb-3" />
                  <p className="mono-label text-gray-600">No Intelligence Matches Found</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'activity':
        return <CTIOpsDashboard targets={targets} activePersona={activePersona} onClose={() => setActiveTab('targets')} />;
      case 'bulk':
        return <BulkScannerView activePersona={activePersona} onClose={() => setActiveTab('targets')} />;
      case 'restoration':
        return <IntelligenceRestorationView activePersona={activePersona} onClose={() => setActiveTab('targets')} />;
      case 'workspace':
        return <CollaborativeWorkspace workspaceId="global-intelligence-workspace" />;
      case 'library':
        return <IntelligenceLibrary />;
      case 'telemetry':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="mono-label text-gray-400 flex items-center gap-2">
                <Binary size={12} className="text-harvest-accent" />
                ARCHITECTURAL TELEMETRY
              </h2>
              <button 
                onClick={() => setActiveTab('targets')}
                className="text-[10px] text-gray-600 hover:text-white transition-colors uppercase tracking-widest"
              >
                Return to Database
              </button>
            </div>
            <AtomicContextViewer metrics={telemetry} />
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-8">
            <UserProfileView settings={settings} />
            <div className="pt-4 border-t border-harvest-border">
              <SystemSettings settings={settings} />
            </div>
            <div className="pt-4 border-t border-harvest-border">
              <UserPersonaManager personas={personas} activePersona={activePersona} onClose={() => setActiveTab('targets')} />
            </div>
          </div>
        );
      case 'monitor':
        return (
          <div className="space-y-4">
            <h2 className="mono-label text-gray-400">Live Intelligence Stream</h2>
            {[
              { type: 'alert', title: 'System Compromise', msg: 'Multiple failed login attempts on endpoint V7-X9', time: 'Just now', severity: 'critical' },
              { type: 'leak', title: 'Credential Exposure', msg: 'PasteBin dump correlates with shadow_broker alias', time: '5m ago', severity: 'high' },
              { type: 'wallet', title: 'Financial Drift', msg: 'Large obfuscated transfer detected in monitored channel', time: '12m ago', severity: 'medium' },
              { type: 'log', title: 'SWI Sync', msg: 'Surface web intelligence updated for 12 nodes', time: '20m ago', severity: 'low' },
            ].map((event, i) => (
              <div key={i} className="hardware-surface p-4 border-l-2 bg-gradient-to-r from-transparent to-white/[0.01]" 
                   style={{ borderLeftColor: event.severity === 'critical' ? '#ff0033' : event.severity === 'high' ? '#ff6600' : '#00ff00' }}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-tighter">{event.title}</h4>
                  <span className="text-[9px] text-gray-600">{event.time}</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">{event.msg}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AndroidLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onAddClick={() => {
        if (settings?.role === 'user') {
          alert('Users do not have permission to create targets.');
          return;
        }
        setIsAdding(true);
      }}
      persona={activePersona}
      onLogout={() => auth.signOut()}
    >
      {renderContent()}

      {/* Add Target Modal */}
      <AnimatePresence>
        {quickScanTarget && (
          <QuickScanModal target={quickScanTarget} onClose={() => setQuickScanTarget(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-harvest-card border-t sm:border border-harvest-border w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl safe-p-bottom"
            >
              <div className="h-1.5 w-12 bg-gray-800 rounded-full mx-auto my-3 sm:hidden" />
              <div className="px-6 py-4 border-b border-harvest-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white uppercase tracking-tighter">Initialize Target</h3>
                  <p className="mono-label !text-[8px]">New Intelligence Mission</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">×</button>
              </div>
              <form onSubmit={handleCreateTarget} className="p-6 space-y-6 bg-harvest-bg/50">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="mono-label">Target Name / Identifier</label>
                    <input 
                      type="text" 
                      required
                      value={newTarget.name}
                      onChange={e => setNewTarget({...newTarget, name: e.target.value})}
                      placeholder="e.g. example.com or @username"
                      className="w-full bg-harvest-card border border-harvest-border rounded-xl px-4 py-3 text-sm focus:border-harvest-accent/50 focus:ring-1 focus:ring-harvest-accent/20 outline-none transition-all placeholder:text-gray-700"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="mono-label">Type</label>
                      <select 
                        value={newTarget.type}
                        onChange={e => setNewTarget({...newTarget, type: e.target.value as any})}
                        className="w-full bg-harvest-card border border-harvest-border rounded-xl px-4 py-3 text-sm focus:border-harvest-accent outline-none"
                      >
                        <option value="domain">DOMAIN</option>
                        <option value="ip">IP ADDRESS</option>
                        <option value="persona">PERSONA</option>
                        <option value="wallet">WALLET</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="mono-label">Status</label>
                      <select 
                        value={newTarget.status}
                        onChange={e => setNewTarget({...newTarget, status: e.target.value as any})}
                        className="w-full bg-harvest-card border border-harvest-border rounded-xl px-4 py-3 text-sm focus:border-harvest-accent outline-none"
                      >
                        <option value="pending">PENDING</option>
                        <option value="active">ACTIVE</option>
                        <option value="archived">ARCHIVED</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="hardware-button-primary w-full py-4 rounded-xl !text-sm"
                  >
                    DEPLOY INVESTIGATION V1.0
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="w-full py-3 mt-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors"
                  >
                    ABORT INITIALIZATION
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AndroidLayout>
  );
};
