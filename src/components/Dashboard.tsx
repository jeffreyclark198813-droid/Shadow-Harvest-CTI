import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { 
  Terminal, Activity, Database, Search, Target as TargetIcon, 
  Plus, ChevronRight, BarChart3, ShieldAlert, LogOut, BookOpen, Network,
  User, Zap, Shield, Cpu, Lock, Globe, Filter, SlidersHorizontal, Trash, X, Star, Binary, Scale,
  RefreshCw, Clock, Sparkles, Bell
} from 'lucide-react';
import { 
  Target, subscribeToTargets, createTarget, deleteTarget, updateTargetPriority, 
  UserPersona, UserSettings, incrementUserStat, unlockAchievement, fetchTargetsOnce 
} from '../services/dbService';
import { GraphDashboardView } from './GraphDashboardView';
import { ThreatIntelligenceWidget } from './ThreatIntelligenceWidget';
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
import { EpistemicConstitutionView } from './EpistemicConstitutionView';
import { UniversalGovSecFrameworkView } from './UniversalGovSecFrameworkView';
import { ThreatVisualization } from './ThreatVisualization';
import { AutomatedAlertsCenter } from './AutomatedAlertsCenter';
import { DCOIPDashboard } from './DCOIPDashboard';
import { IPASNGraphView } from './IPASNGraphView';
import { NetworkTopology } from './NetworkTopology';
import { telemetryService } from '../services/telemetryService';
import { ReliabilityMetric } from '../types/atomic';
import { GlobalEntropyHeatmap } from './GlobalEntropyHeatmap';
import { TemporalThreatHeatmap } from './TemporalThreatHeatmap';
import { ProvenanceModal } from './ProvenanceModal';
import { TemporalEngine } from './TemporalEngine';
import { InferenceEngine } from './InferenceEngine';
import { DataSourceRegistry } from './DataSourceRegistry';
import { SocialNetworkAnalysisView } from './SocialNetworkAnalysisView';
import { ThreatContextualizationView } from './ThreatContextualizationView';
import { DataAnonymizationView } from './DataAnonymizationView';
import { InfrastructureThreatVisualizer } from './InfrastructureThreatVisualizer';
import { ThreatSearchFilterBar, ThreatFilterCriteria } from './ThreatSearchFilterBar';
import { RateLimitAlert } from './RateLimitAlert';
import { useAutoRefreshThreats } from '../hooks/useAutoRefreshThreats';
import { useLiveMode } from '../context/LiveModeContext';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  activePersona: UserPersona;
  personas: UserPersona[];
  settings: UserSettings | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ activePersona, personas, settings }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('targets');
  const [quickScanTarget, setQuickScanTarget] = useState<Target | null>(null);
  const [newTarget, setNewTarget] = useState({ name: '', type: 'domain' as any, status: 'pending' as any });
  const [telemetry, setTelemetry] = useState<ReliabilityMetric[]>([]);
  const [provenanceTarget, setProvenanceTarget] = useState<Target | null>(null);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Advanced Threat Filters State
  const [filters, setFilters] = useState<ThreatFilterCriteria>({
    searchTerm: '',
    threatLevel: 'all',
    entityType: 'all',
    status: 'all',
    dateRange: 'all',
    epistemicLevel: 'all',
    minConfidence: 0
  });

  // Debounce logic for AI components
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 800);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  const navigate = useNavigate();

  // Auto-Refresh & Background Polling Hook
  const { registerRefreshHandler } = useLiveMode();

  const handleFetchTargets = async () => {
    const user = auth.currentUser;
    if (!user || !activePersona) return;
    const freshTargets = await fetchTargetsOnce(user.uid, activePersona.id || null);
    if (freshTargets.length > 0) {
      setTargets(freshTargets);
    }
  };

  const { secondsLeft, isRefreshing, lastRefreshedAt, manualRefresh, isAutoRefreshActive } = useAutoRefreshThreats({
    intervalSeconds: settings?.autoRefreshInterval !== undefined ? settings.autoRefreshInterval : 30,
    onRefresh: handleFetchTargets,
    enabled: true
  });

  // Register with Global Live Mode Context
  useEffect(() => {
    const unregister = registerRefreshHandler('dashboard_threats', handleFetchTargets);
    return () => {
      unregister();
    };
  }, [activePersona]);

  useEffect(() => {
    const unsub = telemetryService.subscribe(setTelemetry);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('dwi_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
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

  const handleSelectRecentSearch = (term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const handleRemoveRecentSearch = (term: string) => {
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('dwi_recent_searches', JSON.stringify(updated));
  };

  const saveRecentSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter(s => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 6);
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

  // Comprehensive Multi-Dimensional Filtering Logic
  const filteredTargets = targets.filter(t => {
    // Search Term
    if (filters.searchTerm.trim()) {
      const q = filters.searchTerm.toLowerCase().trim();
      const matchName = t.name.toLowerCase().includes(q);
      const matchId = (t.id || '').toLowerCase().includes(q);
      const matchType = (t.type || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchType) return false;
    }

    // Entity Type
    if (filters.entityType !== 'all') {
      if (filters.entityType === 'priority' && !t.isPriorityAsset) return false;
      if (filters.entityType === 'sip_trunk' && (t.type as string) !== 'sip_trunk' && t.type !== 'ip') return false;
      if (filters.entityType === 'infrastructure' && t.type !== 'ip' && t.type !== 'domain') return false;
      if (filters.entityType !== 'priority' && filters.entityType !== 'sip_trunk' && filters.entityType !== 'infrastructure') {
        if ((t.type as string) !== filters.entityType) return false;
      }
    }

    // Status
    if (filters.status !== 'all' && t.status !== filters.status) return false;

    // Minimum Confidence Score
    if (filters.minConfidence > 0 && (t.confidenceScore || 0) < filters.minConfidence) return false;

    // Threat Level Severity
    if (filters.threatLevel !== 'all') {
      const score = t.confidenceScore || 0;
      if (filters.threatLevel === 'critical' && score < 80) return false;
      if (filters.threatLevel === 'high' && (score < 60 || score >= 80)) return false;
      if (filters.threatLevel === 'medium' && (score < 40 || score >= 60)) return false;
      if (filters.threatLevel === 'low' && score >= 40) return false;
    }

    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'targets':
        return (
          <div className="space-y-6">
            {/* Global API Rate Limit Alert (Monitors GEMINI_MAX_REQUESTS_PER_MINUTE) */}
            <RateLimitAlert />

            {/* Top Tactical Status Bar with Live Auto-Refresh Cadence HUD */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-black/40 border border-harvest-border rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isAutoRefreshActive ? 'bg-harvest-accent animate-ping' : 'bg-gray-600'}`} />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {isAutoRefreshActive ? 'INTELLIGENCE STREAM ACTIVE' : 'MANUAL SYNC MODE'}
                  </span>
                </div>
                {isAutoRefreshActive && (
                  <span className="text-[10px] font-mono text-gray-400 border-l border-white/10 pl-3">
                    Next sync in: <strong className="text-harvest-accent">{secondsLeft}s</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('govsec')}
                  className="px-3 py-1.5 rounded-xl border border-harvest-accent/30 bg-harvest-accent/10 hover:bg-harvest-accent/20 text-harvest-accent text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all"
                  title="Open Universal GovSec Intelligence Reconsolidation Framework"
                >
                  <Scale size={13} />
                  <span>GOVSEC UGSIDF</span>
                </button>

                <button
                  onClick={() => setShowVisualizer(!showVisualizer)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                    showVisualizer
                      ? 'bg-harvest-accent/15 border-harvest-accent/60 text-white'
                      : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <BarChart3 size={13} className={showVisualizer ? 'text-harvest-accent' : ''} />
                  <span>{showVisualizer ? 'HIDE TOPOLOGY MAP' : 'SHOW TOPOLOGY MAP'}</span>
                </button>

                <button
                  onClick={manualRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 bg-black/50 hover:bg-harvest-accent/10 border border-harvest-border hover:border-harvest-accent/40 rounded-xl text-[11px] font-mono font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
                  title="Force Instant Synchronization"
                >
                  <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-harvest-accent' : 'text-gray-400'} />
                  <span>{isRefreshing ? 'SYNCING...' : 'REFRESH NOW'}</span>
                </button>
              </div>
            </div>

            {/* Infrastructure Threat Visualizer (Recharts Geographic & Cluster Topology) */}
            <AnimatePresence>
              {showVisualizer && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <InfrastructureThreatVisualizer targets={targets} onSelectTarget={t => navigate(`/target/${t.id}`)} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Robust Search & Multi-Dimensional Filtering Component */}
                <ThreatSearchFilterBar
                  filters={filters}
                  onChange={(newFilters) => {
                    setFilters(newFilters);
                    if (newFilters.searchTerm.trim() && newFilters.searchTerm !== filters.searchTerm) {
                      saveRecentSearchTerm(newFilters.searchTerm);
                    }
                  }}
                  totalCount={targets.length}
                  filteredCount={filteredTargets.length}
                  recentSearches={recentSearches}
                  onSelectRecentSearch={handleSelectRecentSearch}
                  onRemoveRecentSearch={handleRemoveRecentSearch}
                />

                {/* Global Entropy Heatmap */}
                <div className="mb-6">
                  <GlobalEntropyHeatmap />
                </div>

                {/* Correlation Heatmap */}
                <div className="mb-6">
                  <CorrelationHeatmap targets={targets} />
                </div>

                {/* Temporal Threat Heatmap */}
                <div className="mb-6">
                  <TemporalThreatHeatmap targets={targets} />
                </div>

                {/* Target Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="mono-label text-gray-400 flex items-center gap-2">
                      <TargetIcon size={12} className="text-harvest-accent" />
                      MONITORED THREAT ASSETS ({filteredTargets.length})
                    </h2>
                    <span className="text-[10px] font-mono text-gray-500">
                      LIVE DATABASE SYNC
                    </span>
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
                              setProvenanceTarget(target);
                            }}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-black/50 hover:text-harvest-accent rounded text-gray-500 transition-all border border-transparent hover:border-harvest-accent/30"
                            title="Provenance State Machine"
                          >
                            <Database size={16} />
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
              
              {/* Sidebar Widget */}
              <div className="lg:block hidden h-full">
                <ThreatIntelligenceWidget context={debouncedSearchTerm || "latest cyber threat intelligence"} />
              </div>
            </div>
          </div>
        );
      case 'activity':
        return <CTIOpsDashboard targets={targets} activePersona={activePersona} onClose={() => setActiveTab('targets')} />;
      case 'temporal':
        return <TemporalEngine />;
      case 'inference':
        return <InferenceEngine />;
      case 'registry':
        return <DataSourceRegistry />;
      case 'personas':
        return <SocialNetworkAnalysisView personas={targets.map(t => ({ id: t.id || '', label: t.name }))} profiles={[]} loading={false} />;
      case 'threats':
        return <ThreatContextualizationView assessments={[]} onGenerate={() => {}} loading={false} />;
      case 'anonymization':
        return <DataAnonymizationView targets={targets} />;
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
      case 'dcoip':
        return (
          <div className="space-y-6">
            <DCOIPDashboard />
          </div>
        );
      case 'ipasngraph':
        return (
          <div className="space-y-6">
            <NetworkTopology />
          </div>
        );
      case 'reconsolidation':
        return (
          <div className="space-y-6">
            <UniversalGovSecFrameworkView />
            <ThreatVisualization targets={targets} onSelectTarget={t => navigate(`/target/${t.id}`)} />
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-6">
            <AutomatedAlertsCenter />
          </div>
        );
      case 'govsec':
        return (
          <div className="space-y-6">
            <UniversalGovSecFrameworkView />
          </div>
        );
      case 'epistemic':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="mono-label text-gray-400 flex items-center gap-2">
                <Scale size={12} className="text-harvest-accent" />
                EPISTEMIC CONSTITUTION & SCIENTIFIC RECONSTRUCTION
              </h2>
              <button 
                onClick={() => setActiveTab('targets')}
                className="text-[10px] text-gray-600 hover:text-white transition-colors uppercase tracking-widest"
              >
                Return to Database
              </button>
            </div>
            <EpistemicConstitutionView />
          </div>
        );
      case 'graph':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="mono-label text-gray-400 flex items-center gap-2">
                <Network size={12} className="text-harvest-accent" />
                INTELLIGENCE GRAPH
              </h2>
              <button 
                onClick={() => setActiveTab('targets')}
                className="text-[10px] text-gray-600 hover:text-white transition-colors uppercase tracking-widest"
              >
                Return to Database
              </button>
            </div>
            <GraphDashboardView />
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

      {/* Provenance Modal */}
      <AnimatePresence>
        {provenanceTarget && (
          <ProvenanceModal target={provenanceTarget} onClose={() => setProvenanceTarget(null)} />
        )}
      </AnimatePresence>

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
