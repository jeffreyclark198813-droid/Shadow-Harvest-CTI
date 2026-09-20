import React, { useState, useMemo } from 'react';
import { 
  Globe, User, Fingerprint, ShieldCheck, Clock, ExternalLink, 
  Search, Filter, CheckCircle2, AlertTriangle, Key, Wallet, 
  Code2, Share2, Eye, EyeOff, ShieldAlert, Sparkles, Send,
  Cpu, FileText, Check, ChevronDown, ChevronRight, Layers, ArrowUpRight, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  SocialProfileEntity, 
  PersonaSocialCorrelationResult, 
  DiscoveredConnectionInsight,
  SocialPlatformId 
} from '../types/social_osint';
import { SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { SocialCorrelatorService } from '../services/socialCorrelatorService';

interface SocialMediaProfilingViewProps {
  personaId: string;
  personaLabel: string;
  targetId: string;
  usernames?: string[];
  emails?: string[];
  wallets?: string[];
  pgpKeys?: string[];
  existingIntelligence?: string;
  onLinkToGraph?: (profile: SocialProfileEntity, rationale: string) => void;
  onLogInsight?: (insight: DiscoveredConnectionInsight) => void;
  onSaveCorrelation?: (result: PersonaSocialCorrelationResult) => void;
}

// Utility to create deterministic pseudonym hash
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 6);
};

export const SocialMediaProfilingView: React.FC<SocialMediaProfilingViewProps> = ({
  personaId,
  personaLabel,
  targetId,
  usernames = [],
  emails = [],
  wallets = [],
  pgpKeys = [],
  existingIntelligence = '',
  onLinkToGraph,
  onLogInsight,
  onSaveCorrelation
}) => {
  const [anonymizePII, setAnonymizePII] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<SocialProfileEntity | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'cadence' | 'insights' | 'compliance'>('profiles');
  const [isScanning, setIsScanning] = useState(false);
  const [linkedProfiles, setLinkedProfiles] = useState<Set<string>>(new Set());
  const [correlationData, setCorrelationData] = useState<PersonaSocialCorrelationResult>(() => {
    return SocialCorrelatorService.generateCorrelation(
      personaId,
      personaLabel,
      targetId,
      usernames,
      emails,
      wallets,
      pgpKeys,
      existingIntelligence
    );
  });

  const maskIdentifier = (type: 'handle' | 'email' | 'wallet' | 'pgp', value: string) => {
    if (!anonymizePII) return value;
    switch (type) {
      case 'handle':
        return `anon_${simpleHash(value)}`;
      case 'email': {
        const parts = value.split('@');
        if (parts.length !== 2) return `contact_${simpleHash(value)}@redacted.tld`;
        const first = parts[0] || '';
        return `${first.charAt(0)}***${first.slice(-1)}@${parts[1] || 'domain'}`;
      }
      case 'wallet':
        if (value.length < 8) return `wallet_${simpleHash(value)}`;
        return `${value.substring(0, 4)}••••${value.substring(value.length - 4)}`;
      case 'pgp':
        return `[PGP_KEY_${simpleHash(value).toUpperCase()}]`;
      default:
        return value;
    }
  };

  const handleRunRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const refreshed = SocialCorrelatorService.generateCorrelation(
        personaId,
        personaLabel,
        targetId,
        usernames,
        emails,
        wallets,
        pgpKeys,
        existingIntelligence
      );
      setCorrelationData(refreshed);
      if (onSaveCorrelation) {
        onSaveCorrelation(refreshed);
      }
      setIsScanning(false);
    }, 1200);
  };

  const handleLinkProfile = (profile: SocialProfileEntity) => {
    const updated = new Set(linkedProfiles);
    updated.add(profile.id);
    setLinkedProfiles(updated);

    if (onLinkToGraph) {
      onLinkToGraph(
        profile,
        `Correlated ${profile.platformName} profile '@${profile.handle}' to persona '${personaLabel}' (Confidence: ${Math.round(profile.confidenceScore * 100)}%)`
      );
    }
  };

  const filteredProfiles = useMemo(() => {
    return correlationData.discoveredProfiles.filter(p => {
      const platConfig = SOCIAL_PLATFORMS[p.platformId];
      const matchCategory = selectedCategory === 'ALL' || (platConfig && platConfig.category === selectedCategory);
      const matchSearch = searchFilter === '' || 
        p.handle.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.platformName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.bio && p.bio.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (p.metadataSignatures.programmingLanguages && p.metadataSignatures.programmingLanguages.some(l => l.toLowerCase().includes(searchFilter.toLowerCase()))) ||
        (p.metadataSignatures.topicsOfInterest && p.metadataSignatures.topicsOfInterest.some(t => t.toLowerCase().includes(searchFilter.toLowerCase())));
      return matchCategory && matchSearch;
    });
  }, [correlationData, selectedCategory, searchFilter]);

  // Aggregate hourly activity across all discovered profiles
  const aggregateHourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => {
      const sum = correlationData.discoveredProfiles.reduce((acc, p) => acc + (p.activityPattern.hourlyDistribution[h] || 0), 0);
      const avg = correlationData.discoveredProfiles.length > 0 ? Math.round(sum / correlationData.discoveredProfiles.length) : 0;
      return {
        hour: `${String(h).padStart(2, '0')}:00 UTC`,
        activityIntensity: avg
      };
    });
    return hours;
  }, [correlationData]);

  const categories = ['ALL', 'Developer & Code', 'Microblogging', 'Professional', 'Community & Forums', 'Messaging & Identity', 'Publishing & Media'];

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="bg-[#111] border border-[#222] p-5 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe size={16} className="text-blue-400" />
                Cross-Platform Social Correlation Matrix
              </h3>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                {correlationData.discoveredProfiles.length} Profiles Identified
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ethical OSINT Aggregation for <span className="text-white font-mono font-semibold">{personaLabel}</span> across surface public graphs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAnonymizePII(!anonymizePII)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${
                anonymizePII 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/30' 
                  : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:text-white'
              }`}
              title="Toggle Personally Identifiable Information Redaction"
            >
              {anonymizePII ? <EyeOff size={13} /> : <Eye size={13} />}
              {anonymizePII ? 'PII Scrubbed' : 'Raw Handles'}
            </button>

            <button
              onClick={handleRunRescan}
              disabled={isScanning}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50"
            >
              {isScanning ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              {isScanning ? 'Probing Graphs...' : 'Deep Correlate'}
            </button>
          </div>
        </div>

        {/* Aggregated Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-black/40 border border-[#222] p-3 rounded">
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Correlation Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-emerald-400">
                {Math.round(correlationData.overallCorrelationConfidence * 100)}%
              </span>
              <span className="text-[9px] text-gray-500">Multi-Vector</span>
            </div>
          </div>

          <div className="bg-black/40 border border-[#222] p-3 rounded">
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Consensus Timezone</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs font-bold font-mono text-white truncate">
                {correlationData.aggregateTimezoneConsensus.primaryTimezone}
              </span>
            </div>
          </div>

          <div className="bg-black/40 border border-[#222] p-3 rounded">
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Queried Usernames</p>
            <div className="flex flex-wrap gap-1 mt-1 truncate">
              {correlationData.queriedUsernames.map((u, i) => (
                <span key={i} className="text-[10px] font-mono text-pink-300 bg-pink-500/10 px-1.5 py-0.5 rounded">
                  {maskIdentifier('handle', u)}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-[#222] p-3 rounded">
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Ethical OSINT Gating</p>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-400">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {correlationData.ethicalAuditSummary.tlpDesignation} // Public
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'profiles', label: 'Discovered Profiles', count: filteredProfiles.length, icon: Globe },
          { id: 'cadence', label: 'Activity Cadence & Timezone', icon: Clock },
          { id: 'insights', label: 'Discovered Connections', count: correlationData.insights.length, icon: Sparkles },
          { id: 'compliance', label: 'Ethical OSINT Audit', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-[#111] text-gray-400 border border-[#222] hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-[9px] bg-black/50 px-1.5 py-0.5 rounded font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFILES VIEW */}
      {activeSubTab === 'profiles' && (
        <div className="space-y-4">
          {/* Filtering Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#111] border border-[#222] p-3 rounded">
            <div className="flex items-center gap-2 flex-1">
              <Search size={14} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search profiles by handle, tech stack, or bio keywords..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder-gray-600 focus:outline-none w-full font-mono"
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter('')} className="text-gray-500 text-xs hover:text-white">
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Filter size={12} className="text-gray-500 shrink-0 mr-1" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[9px] uppercase font-bold tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-white text-black font-semibold'
                      : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProfiles.map(profile => {
              const platConfig = SOCIAL_PLATFORMS[profile.platformId];
              const isLinked = linkedProfiles.has(profile.id);
              const isSelected = selectedProfile?.id === profile.id;

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#111] border rounded-lg overflow-hidden transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                      : 'border-[#222] hover:border-[#333]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#222]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: platConfig?.bgLight || 'rgba(255,255,255,0.05)', color: platConfig?.color || '#fff' }}
                        >
                          {platConfig?.name?.charAt(0) || profile.platformName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white uppercase">{platConfig?.name || profile.platformName}</h4>
                            {profile.verifiedStatus && (
                              <span title="Verified Surface Handle">
                                <CheckCircle2 size={12} className="text-blue-400" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-pink-400">
                            @{maskIdentifier('handle', profile.handle)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                          profile.confidenceScore >= 0.85 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {Math.round(profile.confidenceScore * 100)}% Match
                        </span>
                        <p className="text-[8px] text-gray-600 uppercase mt-1">
                          Age: ~{profile.accountAgeYears}y
                        </p>
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    {profile.bio && (
                      <p className="text-[11px] text-gray-300 mt-3 line-clamp-2 italic bg-black/30 p-2 rounded border border-[#1f1f1f]">
                        "{profile.bio}"
                      </p>
                    )}
                  </div>

                  {/* Card Body - Metadata & Indicators */}
                  <div className="p-4 space-y-3 flex-1">
                    {/* Correlation Evidence Vectors */}
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-1.5">Correlated Evidence</p>
                      <div className="space-y-1">
                        {profile.correlationVectors.slice(0, 2).map((vec, vi) => (
                          <div key={vi} className="flex items-center justify-between text-[9px] bg-black/40 px-2 py-1 rounded border border-[#1e1e1e]">
                            <span className="text-gray-400 truncate max-w-[170px]">{vec.vectorType}</span>
                            <span className="text-emerald-400 font-mono font-semibold">+{Math.round(vec.confidence * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Signatures (Languages / Topics) */}
                    {profile.metadataSignatures.programmingLanguages && profile.metadataSignatures.programmingLanguages.length > 0 && (
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tech Signatures</p>
                        <div className="flex flex-wrap gap-1">
                          {profile.metadataSignatures.programmingLanguages.map((lang, li) => (
                            <span key={li} className="text-[9px] bg-[#1a1a1a] text-blue-300 px-1.5 py-0.5 rounded border border-[#2a2a2a] font-mono">
                              {lang}
                            </span>
                          ))}
                          {profile.metadataSignatures.pgpKeyIds && (
                            <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30 font-mono flex items-center gap-1">
                              <Key size={9} /> {maskIdentifier('pgp', profile.metadataSignatures.pgpKeyIds[0])}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timezone / Cadence */}
                    <div className="flex items-center justify-between text-[9px] text-gray-400 bg-black/20 px-2 py-1 rounded">
                      <span className="flex items-center gap-1">
                        <Clock size={10} className="text-gray-500" />
                        {profile.activityPattern.inferredTimezone}
                      </span>
                      <span className="text-gray-500 font-mono">
                        {profile.activityPattern.postingFrequency}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-[#0d0d0d] border-t border-[#222] flex items-center justify-between gap-2">
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
                    >
                      <ExternalLink size={11} /> Public URL
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProfile(isSelected ? null : profile)}
                        className="text-[10px] bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 px-2 py-1 rounded border border-[#333] transition-colors"
                      >
                        {isSelected ? 'Collapse' : 'Deep Trace'}
                      </button>

                      <button
                        onClick={() => handleLinkProfile(profile)}
                        disabled={isLinked}
                        className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                          isLinked
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {isLinked ? <Check size={11} /> : <Share2 size={11} />}
                        {isLinked ? 'Linked' : 'Link Graph'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Deep Trace Drawer */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/60 border-t border-[#222] p-4 space-y-3 overflow-hidden text-xs"
                      >
                        <div>
                          <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Recent Public Activities & Commits
                          </h5>
                          <div className="space-y-1.5">
                            {profile.recentPublicActivities.map((act, ai) => (
                              <div key={ai} className="bg-[#141414] p-2 rounded border border-[#222]">
                                <div className="flex justify-between items-start text-[9px]">
                                  <span className="text-blue-400 font-bold uppercase">{act.type}</span>
                                  <span className="text-gray-500 font-mono">{act.timestamp.slice(0, 10)}</span>
                                </div>
                                <p className="text-[10px] text-gray-300 mt-1">{act.title}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {profile.metadataSignatures.opsecFindings && (
                          <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded">
                            <p className="text-[9px] font-bold text-red-400 uppercase flex items-center gap-1">
                              <ShieldAlert size={11} /> OPSEC Assessment (Score: {profile.metadataSignatures.opsecScore}/100)
                            </p>
                            <ul className="mt-1 space-y-1">
                              {profile.metadataSignatures.opsecFindings.map((f, fi) => (
                                <li key={fi} className="text-[9px] text-gray-300 list-disc list-inside">
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-[9px] text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck size={12} className="shrink-0" />
                          <span>{profile.ethicalCompliance.dataProvenanceNote}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="bg-[#111] border border-[#222] p-12 rounded text-center">
              <Globe size={40} className="mx-auto text-gray-700 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No matching social media profiles found</p>
              <p className="text-[10px] text-gray-600 mt-1">Try broadening your search term or trigger a Deep Correlate scan.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVITY CADENCE & TIMEZONE ANALYSIS */}
      {activeSubTab === 'cadence' && (
        <div className="space-y-6">
          <div className="bg-[#111] border border-[#222] p-5 rounded-lg space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={15} className="text-purple-400" />
                Aggregated 24-Hour Diurnal Cadence (UTC)
              </h4>
              <p className="text-[11px] text-gray-400 mt-1">
                Synthesized hourly commit and post frequency across all correlated accounts. Peaks reflect operator working windows.
              </p>
            </div>

            {/* Diurnal Bar Chart */}
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aggregateHourlyData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="hour" stroke="#666" tick={{ fontSize: 9, fill: '#888' }} interval={2} angle={-30} textAnchor="end" />
                  <YAxis stroke="#666" tick={{ fontSize: 9, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '6px', fontSize: '11px' }}
                    labelStyle={{ color: '#aaa' }}
                  />
                  <Area isAnimationActive={false} type="monotone" dataKey="activityIntensity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#cadenceGradient)" name="Intensity Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Timezone Deduction Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#222]">
              <div className="bg-black/40 p-3.5 rounded border border-[#222]">
                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Inferred Primary Timezone</p>
                <p className="text-sm font-bold text-white font-mono mt-1">
                  {correlationData.aggregateTimezoneConsensus.primaryTimezone}
                </p>
                <p className="text-[9px] text-gray-400 mt-1">
                  Based on daylight hour clustering (12:00 - 20:00 UTC).
                </p>
              </div>

              <div className="bg-black/40 p-3.5 rounded border border-[#222]">
                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Active Days Distribution</p>
                <p className="text-sm font-bold text-emerald-400 font-mono mt-1">
                  Mon — Fri (Weekday Bias)
                </p>
                <p className="text-[9px] text-gray-400 mt-1">
                  Significant activity drop during Saturday/Sunday indicates structured professional operations.
                </p>
              </div>

              <div className="bg-black/40 p-3.5 rounded border border-[#222]">
                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Attribution Confidence</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${Math.round(correlationData.aggregateTimezoneConsensus.confidence * 100)}%` }} 
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {Math.round(correlationData.aggregateTimezoneConsensus.confidence * 100)}%
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">
                  Supported by {correlationData.aggregateTimezoneConsensus.supportingPlatformsCount} disparate platform observations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISCOVERED CONNECTIONS & INSIGHTS */}
      {activeSubTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#111] border border-[#222] p-4 rounded-lg">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={15} className="text-amber-400" />
                Discovered Cross-Platform Insights ({correlationData.insights.length})
              </h4>
              <p className="text-[11px] text-gray-400 mt-1">
                Actionable analytical conclusions generated by correlating surface social profiles against target intelligence.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {correlationData.insights.map(insight => {
              const severityColor = 
                insight.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-500/5 text-red-400' :
                insight.severity === 'HIGH' ? 'border-orange-500/40 bg-orange-500/5 text-orange-400' :
                'border-blue-500/40 bg-blue-500/5 text-blue-400';

              return (
                <div key={insight.id} className="bg-[#111] border border-[#222] p-5 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${severityColor}`}>
                        {insight.severity} // {insight.category}
                      </span>
                      <h5 className="text-xs font-bold text-white uppercase">{insight.title}</h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-400 font-mono">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </span>
                      {onLogInsight && (
                        <button
                          onClick={() => onLogInsight(insight)}
                          className="text-[9px] bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 px-2.5 py-1 rounded border border-[#333] transition-colors flex items-center gap-1"
                        >
                          <FileText size={10} /> Log to Case Notes
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {insight.insightText}
                  </p>

                  {insight.actionableLead && (
                    <div className="bg-black/50 p-3 rounded border border-[#222] space-y-1">
                      <p className="text-[8px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <ArrowUpRight size={10} /> Actionable Lead / Investigative Pivot
                      </p>
                      <p className="text-[11px] text-gray-300">{insight.actionableLead}</p>
                    </div>
                  )}

                  {insight.stixPattern && (
                    <div className="bg-[#0a0a0a] p-2.5 rounded border border-[#1e1e1e] font-mono text-[9px] text-purple-300 flex items-center gap-2 overflow-x-auto">
                      <Code2 size={12} className="shrink-0 text-purple-400" />
                      <span className="text-gray-500">STIX 2.1:</span>
                      <code>{insight.stixPattern}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ETHICAL OSINT AUDIT & LEGAL BOUNDARIES */}
      {activeSubTab === 'compliance' && (
        <div className="space-y-5">
          <div className="bg-[#111] border border-[#222] p-5 rounded-lg space-y-4">
            <div className="border-b border-[#222] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                Ethical OSINT Framework & Legal Compliance Audit
              </h4>
              <p className="text-[11px] text-gray-400 mt-1">
                Verification that all reconnaissance strictly adheres to public accessibility constraints, terms of service, and international privacy standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 border border-[#222] p-4 rounded space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={14} /> Zero Intrusive Scanning & Zero Auth Bypass
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  No automated authentication brute-forcing, session hijacking, or private graph scraping was performed. All data points were resolved from publicly indexed surface profiles, DNS records, and permissive REST/ActivityPub endpoints.
                </p>
              </div>

              <div className="bg-black/40 border border-[#222] p-4 rounded space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={14} /> Rate Limiting & Robots.txt Compliance
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  All discovery queries strictly honored remote platform crawl delays, robots exclusion standards, and API rate gates to prevent denial-of-service or operational telemetry flagging.
                </p>
              </div>

              <div className="bg-black/40 border border-[#222] p-4 rounded space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={14} /> GDPR & Privacy Shield Sanitization
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Export pipelines enforce deterministic pseudonymization and reversible pseudonym hashing to prevent accidental PII leakage in inter-agency dossiers.
                </p>
              </div>

              <div className="bg-black/40 border border-[#222] p-4 rounded space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={14} /> Traffic Light Protocol (TLP) Designation
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Classification is tagged as <strong className="text-emerald-400">TLP:GREEN</strong>. Information is shareable within authorized community partners and security research groups.
                </p>
              </div>
            </div>

            {/* Analyst Attestation */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded space-y-1 text-xs">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} /> Official Compliance Attestation
              </p>
              <p className="text-gray-300 text-[11px]">
                {correlationData.ethicalAuditSummary.analystAttestation}
              </p>
              <p className="text-[9px] text-gray-500 font-mono mt-1">
                Audited at: {new Date().toISOString()} // Target ID: {targetId}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
