import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, ShieldAlert, Cpu, Globe, User, Zap, Star, 
  RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, X, Radio, Activity,
  Server, PhoneCall, ShieldCheck, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ThreatFilterCriteria {
  searchTerm: string;
  threatLevel: 'all' | 'critical' | 'high' | 'medium' | 'low';
  entityType: 'all' | 'domain' | 'ip' | 'persona' | 'wallet' | 'sip_trunk' | 'infrastructure' | 'priority';
  status: 'all' | 'active' | 'pending' | 'archived';
  dateRange: 'all' | '24h' | '7d' | '30d';
  epistemicLevel: 'all' | 'T0' | 'T1' | 'T2' | 'T3' | 'T4';
  minConfidence: number; // 0 to 100
}

interface ThreatSearchFilterBarProps {
  filters: ThreatFilterCriteria;
  onChange: (filters: ThreatFilterCriteria) => void;
  totalCount: number;
  filteredCount: number;
  recentSearches?: string[];
  onSelectRecentSearch?: (term: string) => void;
  onRemoveRecentSearch?: (term: string) => void;
}

export const ThreatSearchFilterBar: React.FC<ThreatSearchFilterBarProps> = ({
  filters,
  onChange,
  totalCount,
  filteredCount,
  recentSearches = [],
  onSelectRecentSearch,
  onRemoveRecentSearch
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const activeFilterCount = [
    filters.threatLevel !== 'all',
    filters.entityType !== 'all',
    filters.status !== 'all',
    filters.dateRange !== 'all',
    filters.epistemicLevel !== 'all',
    filters.minConfidence > 0,
    Boolean(filters.searchTerm.trim())
  ].filter(Boolean).length;

  const handleReset = () => {
    onChange({
      searchTerm: '',
      threatLevel: 'all',
      entityType: 'all',
      status: 'all',
      dateRange: 'all',
      epistemicLevel: 'all',
      minConfidence: 0
    });
  };

  return (
    <div className="space-y-3">
      {/* Primary Search Bar & Fast Filter Bar */}
      <div className="bg-harvest-card border border-harvest-border rounded-2xl p-3 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH BY DOMAIN, IP, THREAT VECTOR, CARRIER TRUNK, PROTOCOL OR ASSET ID..."
              value={filters.searchTerm}
              onChange={e => onChange({ ...filters, searchTerm: e.target.value })}
              onFocus={() => setShowRecentSearches(true)}
              onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
              className="w-full bg-black/40 border border-harvest-border rounded-xl pl-10 pr-10 py-2.5 text-xs 
                         font-mono text-white placeholder:text-gray-600 focus:border-harvest-accent/60 
                         focus:ring-1 focus:ring-harvest-accent/30 outline-none transition-all"
            />
            {filters.searchTerm && (
              <button
                onClick={() => onChange({ ...filters, searchTerm: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white rounded-md hover:bg-white/10"
              >
                <X size={14} />
              </button>
            )}

            {/* Recent Searches Dropdown */}
            <AnimatePresence>
              {showRecentSearches && recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-12 left-0 right-0 bg-[#0c0f12] border border-harvest-border rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-3 py-1.5 bg-black/60 border-b border-white/5 flex justify-between items-center text-[10px] font-mono text-gray-500">
                    <span>RECENT INTELLIGENCE QUERIES</span>
                  </div>
                  {recentSearches.map((term, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectRecentSearch && onSelectRecentSearch(term)}
                      className="flex items-center justify-between px-3.5 py-2 hover:bg-white/5 cursor-pointer text-xs font-mono text-gray-300 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Search size={13} className="text-gray-500" />
                        <span>{term}</span>
                      </div>
                      {onRemoveRecentSearch && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveRecentSearch(term);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-all"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                isExpanded || activeFilterCount > 0
                  ? 'bg-harvest-accent/15 border-harvest-accent/50 text-white'
                  : 'bg-black/40 border-harvest-border text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <SlidersHorizontal size={14} className={activeFilterCount > 0 ? 'text-harvest-accent' : ''} />
              <span>FILTERS</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 bg-harvest-accent text-black text-[10px] font-black rounded-full">
                  {activeFilterCount}
                </span>
              )}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="px-2.5 py-2 bg-red-950/30 border border-red-900/50 hover:border-red-500 rounded-xl text-red-400 hover:text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                title="Reset All Filters"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">RESET</span>
              </button>
            )}

            <div className="px-3 py-2 bg-black/40 border border-harvest-border rounded-xl text-[11px] font-mono text-gray-400">
              <span className="text-white font-bold">{filteredCount}</span>
              <span className="text-gray-600"> / {totalCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Entity Type Scroll Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-white/5">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mr-1 shrink-0">
            Entity:
          </span>
          {[
            { id: 'all', label: 'All Entities', icon: Activity },
            { id: 'priority', label: 'Priority Starred', icon: Star },
            { id: 'domain', label: 'Domains', icon: Globe },
            { id: 'ip', label: 'IP Networks', icon: Cpu },
            { id: 'sip_trunk', label: 'SIP / Voice', icon: PhoneCall },
            { id: 'infrastructure', label: 'Infra / Nodes', icon: Server },
            { id: 'persona', label: 'Personas', icon: User },
            { id: 'wallet', label: 'Crypto Wallets', icon: Zap },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = filters.entityType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onChange({ ...filters, entityType: type.id as any })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 uppercase transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-harvest-accent text-black shadow-[0_0_8px_rgba(0,255,153,0.4)]'
                    : 'bg-black/30 border border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10'
                }`}
              >
                <Icon size={12} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Multi-Dimensional Filtering Matrix */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-harvest-card border border-harvest-border rounded-2xl p-4 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Threat Severity Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-red-400" />
                  Threat Severity Level
                </label>
                <select
                  value={filters.threatLevel}
                  onChange={e => onChange({ ...filters, threatLevel: e.target.value as any })}
                  className="w-full bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-harvest-accent outline-none"
                >
                  <option value="all">ALL SEVERITY LEVELS</option>
                  <option value="critical">🔴 CRITICAL (Score ≥ 80)</option>
                  <option value="high">🟠 HIGH (Score 60 - 79)</option>
                  <option value="medium">🟡 MEDIUM (Score 40 - 59)</option>
                  <option value="low">🟢 LOW (Score &lt; 40)</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} className="text-cyan-400" />
                  Observation Horizon
                </label>
                <select
                  value={filters.dateRange}
                  onChange={e => onChange({ ...filters, dateRange: e.target.value as any })}
                  className="w-full bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-harvest-accent outline-none"
                >
                  <option value="all">ALL TIME HORIZONS</option>
                  <option value="24h">LAST 24 HOURS (Real-time)</option>
                  <option value="7d">LAST 7 DAYS (Operational)</option>
                  <option value="30d">LAST 30 DAYS (Strategic)</option>
                </select>
              </div>

              {/* Epistemic Level Classification (USIAF-X v∞ Standard) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-purple-400" />
                  Epistemic State (T0 - T4)
                </label>
                <select
                  value={filters.epistemicLevel}
                  onChange={e => onChange({ ...filters, epistemicLevel: e.target.value as any })}
                  className="w-full bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-harvest-accent outline-none"
                >
                  <option value="all">ALL EPISTEMIC LEVELS</option>
                  <option value="T0">T0 - Directly Observed Fact</option>
                  <option value="T1">T1 - Standards/RFC Derived</option>
                  <option value="T2">T2 - Carrier/External Dependent</option>
                  <option value="T3">T3 - Analytical Inference</option>
                  <option value="T4">T4 - Unverified Hypothesis</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={12} className="text-emerald-400" />
                  Lifecycle State
                </label>
                <select
                  value={filters.status}
                  onChange={e => onChange({ ...filters, status: e.target.value as any })}
                  className="w-full bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-harvest-accent outline-none"
                >
                  <option value="all">ALL LIFECYCLE STATES</option>
                  <option value="active">ACTIVE INVESTIGATION</option>
                  <option value="pending">PENDING TRIAGE</option>
                  <option value="archived">HISTORIC ARCHIVE</option>
                </select>
              </div>
            </div>

            {/* Minimum Confidence Slider */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-1/2">
                <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                  MIN CONFIDENCE SCORE: <strong className="text-harvest-accent">{filters.minConfidence}%</strong>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={filters.minConfidence}
                  onChange={e => onChange({ ...filters, minConfidence: Number(e.target.value) })}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-harvest-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-500">
                  USIAF-X Epistemic Protocol v12.0 Active
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
