import React, { useState } from 'react';
import { AdvancedPersonaProfile } from '../services/dbService';
import { 
  User, Fingerprint, Wallet, Mail, PenTool, Clock, ShieldAlert, 
  Brain, EyeOff, Eye, Globe, Sparkles, Layers, Activity, Share2, Network 
} from 'lucide-react';
import { motion } from 'motion/react';
import { SocialMediaProfilingView } from './SocialMediaProfilingView';
import { BehavioralCadenceView } from './BehavioralCadenceView';
import { SocialProfileEntity, DiscoveredConnectionInsight } from '../types/social_osint';

interface PersonaProfilingViewProps {
  profiles: AdvancedPersonaProfile[];
  onProfile: (personaId: string, label: string) => void;
  loading: boolean;
  personas: { id: string; label: string }[];
  targetId?: string;
  onLinkToGraph?: (profile: SocialProfileEntity, rationale: string) => void;
  onLogReport?: (title: string, content: string) => void;
  onPushSignaturesToGraph?: (profile: AdvancedPersonaProfile) => void;
}

// Utility to create consistent pseudonyms
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 6);
};

export const PersonaProfilingView: React.FC<PersonaProfilingViewProps> = ({ 
  profiles, 
  onProfile, 
  loading, 
  personas,
  targetId = 'target-primary',
  onLinkToGraph,
  onLogReport,
  onPushSignaturesToGraph
}) => {
  const [anonymizePII, setAnonymizePII] = useState(true);
  const [activePersonaId, setActivePersonaId] = useState<string>(personas[0]?.id || 'actor-01');
  const [activeProfilingTab, setActiveProfilingTab] = useState<'social_correlation' | 'stylometrics'>('social_correlation');
  const [stylometricSubTab, setStylometricSubTab] = useState<'cadence_opsec' | 'identifiers'>('cadence_opsec');
  const [graphPushed, setGraphPushed] = useState(false);

  const selectedPersona = personas.find(p => p.id === activePersonaId) || personas[0] || { id: 'actor-01', label: 'ShadowOperator_99' };
  const selectedProfile = profiles.find(p => p.personaId === selectedPersona.id);

  const handlePushToGraph = () => {
    if (selectedProfile && onPushSignaturesToGraph) {
      onPushSignaturesToGraph(selectedProfile);
      setGraphPushed(true);
      setTimeout(() => setGraphPushed(false), 3000);
    }
  };

  const maskIdentifier = (type: 'username' | 'email' | 'wallet' | 'pgp', value: string) => {
    if (!anonymizePII) return value;
    
    switch (type) {
      case 'username':
        return `Alias-${simpleHash(value).toUpperCase()}`;
      case 'email': {
        const parts = value.split('@');
        if (parts.length !== 2) return `Contact-${simpleHash(value)}`;
        const namePart = parts[0] || '';
        const maskedName = namePart ? `${namePart.charAt(0)}***${namePart.charAt(namePart.length - 1)}` : '***';
        return `${maskedName}@REDACTED.tld`;
      }
      case 'wallet':
        if (value.length < 8) return `Wallet-${simpleHash(value)}`;
        return `${value.substring(0, 4)}••••••••${value.substring(value.length - 4)}`;
      case 'pgp':
        return `[REDACTED_FINGERPRINT_${simpleHash(value).toUpperCase()}]`;
      default:
        return value;
    }
  };

  const handleLogInsightToReport = (insight: DiscoveredConnectionInsight) => {
    if (onLogReport) {
      onLogReport(
        `OSINT Finding: ${insight.title} [${insight.severity}]`,
        `### Discovered Intelligence Insight\n\n**Category:** ${insight.category}\n**Severity:** ${insight.severity}\n**Confidence:** ${Math.round(insight.confidence * 100)}%\n\n${insight.insightText}\n\n**Actionable Pivot:** ${insight.actionableLead || 'N/A'}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111] border border-[#222] p-4 rounded-lg">
        <div>
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
            <Brain size={16} className="text-pink-500" />
            Persona Profiling & Social Media OSINT Engine
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Cross-platform handle correlation, stylometric linguistic analysis, and ethical public metadata extraction.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded border border-[#222]">
          <button
            onClick={() => setActiveProfilingTab('social_correlation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
              activeProfilingTab === 'social_correlation'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe size={13} />
            Social Media Correlation
          </button>

          <button
            onClick={() => setActiveProfilingTab('stylometrics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
              activeProfilingTab === 'stylometrics'
                ? 'bg-pink-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PenTool size={13} />
            Stylometrics & Signatures
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Target Persona Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#111] border border-[#222] p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={13} /> Identified Personas
              </h4>
              <span className="text-[9px] bg-[#1a1a1a] text-gray-400 px-1.5 py-0.5 rounded font-mono">
                {personas.length}
              </span>
            </div>

            <div className="space-y-2">
              {personas.map((persona) => {
                const isSelected = persona.id === selectedPersona.id;
                const hasProfile = profiles.some(p => p.personaId === persona.id);

                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      setActivePersonaId(persona.id);
                      if (!hasProfile) {
                        onProfile(persona.id, persona.label);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-sm'
                        : hasProfile
                          ? 'bg-[#161616] border-[#2a2a2a] hover:border-[#444]'
                          : 'bg-[#0d0d0d] border-[#1e1e1e] hover:border-[#333]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white uppercase font-mono">{persona.label}</p>
                      <p className="text-[9px] text-gray-500 uppercase mt-0.5">
                        {hasProfile ? 'Stylometric Ready' : 'Pending Profile'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {loading && isSelected ? (
                        <div className="w-3.5 h-3.5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Globe size={13} className={isSelected ? 'text-blue-400' : 'text-gray-600'} />
                      )}
                    </div>
                  </button>
                );
              })}

              {personas.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-[10px] uppercase font-mono">
                  No personas resolved. Run a target scan to discover actor handles.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Tab Content */}
        <div className="lg:col-span-3">
          {activeProfilingTab === 'social_correlation' ? (
            <SocialMediaProfilingView
              key={selectedPersona.id}
              personaId={selectedPersona.id}
              personaLabel={selectedPersona.label}
              targetId={targetId}
              usernames={selectedProfile?.identifiers.usernames || [selectedPersona.label.toLowerCase()]}
              emails={selectedProfile?.identifiers.emails || [`${selectedPersona.label.toLowerCase()}@proton.me`]}
              wallets={selectedProfile?.identifiers.wallets || []}
              pgpKeys={selectedProfile?.identifiers.pgpFingerprints || []}
              onLinkToGraph={onLinkToGraph}
              onLogInsight={handleLogInsightToReport}
            />
          ) : (
            /* STYLOMETRICS & BEHAVIORAL SIGNATURES TAB */
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#111] border border-[#222] p-4 rounded-lg">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <PenTool size={14} className="text-pink-400" />
                    Stylometric Linguistic & Behavioral Footprint // {selectedPersona.label}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Synthesizes dialect markers, lexical density, activity cadence, and operational security habits.
                  </p>
                </div>

                <button 
                  onClick={() => setAnonymizePII(!anonymizePII)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${
                    anonymizePII ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-[#1a1a1a] text-gray-400 border border-[#333]'
                  }`}
                >
                  {anonymizePII ? <EyeOff size={12} /> : <Eye size={12} />}
                  {anonymizePII ? 'PII Scrubbed' : 'Raw PII'}
                </button>
              </div>

              {!selectedProfile ? (
                <div className="bg-[#111] border border-[#222] p-12 rounded-lg text-center space-y-4">
                  <Brain size={44} className="mx-auto text-gray-700" />
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Awaiting Deep Stylometric Analysis</h5>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-sm mx-auto">
                      Run an automated intelligence scan to extract writing samples, sentiment variance, and PGP key signatures for {selectedPersona.label}.
                    </p>
                  </div>
                  <button
                    onClick={() => onProfile(selectedPersona.id, selectedPersona.label)}
                    disabled={loading}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={13} />}
                    {loading ? 'Synthesizing Profile...' : 'Run Stylometric Scan'}
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#111] border border-[#222] rounded-lg overflow-hidden space-y-6 p-6"
                >
                  {/* Sub-tab Navigation and Push to Graph Action */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#222]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStylometricSubTab('cadence_opsec')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${
                          stylometricSubTab === 'cadence_opsec'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-[#181818] text-gray-400 hover:text-white border border-[#2a2a2a]'
                        }`}
                      >
                        <Clock size={12} />
                        Behavioral Cadence, Timezone & Stylometry
                      </button>

                      <button
                        onClick={() => setStylometricSubTab('identifiers')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${
                          stylometricSubTab === 'identifiers'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-[#181818] text-gray-400 hover:text-white border border-[#2a2a2a]'
                        }`}
                      >
                        <Fingerprint size={12} />
                        Correlated Identifiers ({selectedProfile.identifiers.usernames.length + selectedProfile.identifiers.emails.length})
                      </button>
                    </div>

                    {onPushSignaturesToGraph && (
                      <button
                        onClick={handlePushToGraph}
                        disabled={graphPushed}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                          graphPushed
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-[#1e1e1e] hover:bg-cyan-900/40 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        <Network size={12} />
                        {graphPushed ? 'Injected into Unified Graph!' : 'Push Signatures to Unified Graph'}
                      </button>
                    )}
                  </div>

                  {stylometricSubTab === 'cadence_opsec' ? (
                    <BehavioralCadenceView
                      profile={selectedProfile}
                      personaLabel={selectedPersona.label}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Identifiers Column */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Fingerprint size={13} className="text-blue-400" /> Correlated Technical Identifiers
                        </h5>

                        <div className="space-y-3">
                          <div className="bg-black/30 p-3.5 rounded border border-[#222]">
                            <p className="text-[9px] text-gray-500 uppercase font-semibold mb-2">Usernames & Aliases</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedProfile.identifiers.usernames.map((u, i) => (
                                <span key={i} className="text-[10px] font-mono bg-[#1a1a1a] px-2 py-0.5 rounded text-pink-300 border border-[#2a2a2a]">
                                  {maskIdentifier('username', u)}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="bg-black/30 p-3.5 rounded border border-[#222]">
                            <p className="text-[9px] text-gray-500 uppercase font-semibold mb-2">Email Handles</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedProfile.identifiers.emails.map((e, i) => (
                                <span key={i} className="text-[10px] font-mono bg-[#1a1a1a] px-2 py-0.5 rounded text-blue-300 border border-[#2a2a2a] flex items-center gap-1">
                                  <Mail size={10} /> {maskIdentifier('email', e)}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="bg-black/30 p-3.5 rounded border border-[#222]">
                            <p className="text-[9px] text-gray-500 uppercase font-semibold mb-2">PGP Key Fingerprints</p>
                            <div className="space-y-1">
                              {selectedProfile.identifiers.pgpFingerprints.map((f, i) => (
                                <p key={i} className="text-[10px] font-mono text-gray-300 break-all bg-[#141414] p-1.5 rounded">
                                  {maskIdentifier('pgp', f)}
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="bg-black/30 p-3.5 rounded border border-[#222]">
                            <p className="text-[9px] text-gray-500 uppercase font-semibold mb-2">Cryptocurrency Wallets</p>
                            <div className="space-y-1">
                              {selectedProfile.identifiers.wallets.map((w, i) => (
                                <p key={i} className="text-[10px] font-mono text-orange-400 flex items-center gap-1.5 bg-[#141414] p-1.5 rounded">
                                  <Wallet size={11} /> {maskIdentifier('wallet', w)}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Linguistic & OPSEC Summary Column */}
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <PenTool size={13} className="text-pink-400" /> Stylometric Linguistic Analysis
                          </h5>
                          <div className="bg-[#161616] p-4 rounded-lg border border-[#2a2a2a] space-y-3">
                            <div>
                              <p className="text-[9px] text-gray-500 uppercase font-semibold">Writing Style</p>
                              <p className="text-xs text-gray-200 mt-0.5">{selectedProfile.stylometricAnalysis.writingStyle}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-500 uppercase font-semibold">Vocabulary & Dialect</p>
                              <p className="text-xs text-gray-200 mt-0.5">{selectedProfile.stylometricAnalysis.vocabulary}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-500 uppercase font-semibold">Dominant Sentiment</p>
                              <p className="text-xs text-pink-300 italic mt-0.5">"{selectedProfile.stylometricAnalysis.sentiment}"</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={13} className="text-purple-400" /> Behavioral & OPSEC Assessment
                          </h5>
                          <div className="bg-[#161616] p-4 rounded-lg border border-[#2a2a2a] space-y-3">
                            <div>
                              <p className="text-[9px] text-gray-500 uppercase font-semibold">Activity Cadence</p>
                              <p className="text-xs text-gray-200 mt-0.5">{selectedProfile.behavioralSignature.activityCadence}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-500 uppercase font-semibold">Timezone Inference</p>
                              <p className="text-xs text-white font-bold font-mono mt-0.5">{selectedProfile.behavioralSignature.timezoneInference}</p>
                            </div>
                            {selectedProfile.behavioralSignature.regionalIndicators && (
                              <div>
                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Regional Indicators</p>
                                <p className="text-xs text-blue-300 italic mt-0.5">{selectedProfile.behavioralSignature.regionalIndicators}</p>
                              </div>
                            )}
                            <div className="flex items-start gap-2 bg-red-500/10 p-2.5 rounded border border-red-500/20">
                              <ShieldAlert size={15} className="text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] text-red-400 uppercase font-bold">OPSEC Habits & Leakage</p>
                                <p className="text-[10px] text-gray-300 mt-0.5">{selectedProfile.behavioralSignature.operationalSecurity}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
