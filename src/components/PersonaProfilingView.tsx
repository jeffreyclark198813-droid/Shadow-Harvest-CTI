import React, { useState } from 'react';
import { AdvancedPersonaProfile } from '../services/dbService';
import { User, Fingerprint, Wallet, Mail, PenTool, Clock, ShieldAlert, Brain, EyeOff, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface PersonaProfilingViewProps {
  profiles: AdvancedPersonaProfile[];
  onProfile: (personaId: string, label: string) => void;
  loading: boolean;
  personas: { id: string, label: string }[];
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

export const PersonaProfilingView: React.FC<PersonaProfilingViewProps> = ({ profiles, onProfile, loading, personas }) => {
  const [anonymizePII, setAnonymizePII] = useState(true);

  const maskIdentifier = (type: 'username' | 'email' | 'wallet' | 'pgp', value: string) => {
    if (!anonymizePII) return value;
    
    switch (type) {
      case 'username':
        // Generalization / Hash pseudonymization
        return `Alias-${simpleHash(value).toUpperCase()}`;
      case 'email': {
        // Masking: j***.d**@example.com -> generalize domain too
        const parts = value.split('@');
        if (parts.length !== 2) return `Contact-${simpleHash(value)}`;
        const namePart = parts[0];
        const maskedName = namePart.charAt(0) + '***' + namePart.charAt(namePart.length - 1);
        return `${maskedName}@REDACTED.tld`;
      }
      case 'wallet':
        // Masking
        if (value.length < 8) return `Wallet-${simpleHash(value)}`;
        return `${value.substring(0, 4)}••••••••${value.substring(value.length - 4)}`;
      case 'pgp':
        // Generalization
        return `[REDACTED_FINGERPRINT_${simpleHash(value).toUpperCase()}]`;
      default:
        return value;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Brain size={14} className="text-pink-500" />
          Advanced Persona Profiling Module
        </h3>
        <button 
          onClick={() => setAnonymizePII(!anonymizePII)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-colors ${anonymizePII ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-[#1a1a1a] text-gray-500 border border-[#333] hover:text-gray-300'}`}
        >
          {anonymizePII ? <EyeOff size={12} /> : <Eye size={12} />}
          {anonymizePII ? 'PII Redacted' : 'Show Raw PII'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Persona List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#111] border border-[#222] p-4 rounded">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Target Personas</h4>
            <div className="space-y-2">
              {personas.map((persona) => {
                const hasProfile = profiles.some(p => p.personaId === persona.id);
                return (
                  <button
                    key={persona.id}
                    onClick={() => onProfile(persona.id, persona.label)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-3 rounded border transition-all text-left ${
                      hasProfile ? 'bg-[#1a1a1a] border-pink-500/30 hover:border-pink-500' : 'bg-[#0d0d0d] border-[#222] hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{persona.label}</p>
                      <p className="text-[9px] text-gray-500 uppercase mt-1">
                        {hasProfile ? 'Profiled' : 'Awaiting Deep Analysis'}
                      </p>
                    </div>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Brain size={14} className={hasProfile ? 'text-pink-500' : 'text-gray-600'} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profile Results */}
        <div className="lg:col-span-2 space-y-6">
          {profiles.length === 0 && !loading && (
            <div className="bg-[#111] border border-[#222] p-12 rounded text-center">
              <User size={48} className="mx-auto text-gray-800 mb-4" />
              <p className="text-sm text-gray-500 uppercase tracking-widest">Select a persona for stylometric and behavioral analysis</p>
            </div>
          )}

          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[#1a1a1a] border-b border-[#222] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Entity Profile // {profile.personaId}</span>
                  <span className="text-[10px] text-gray-600">{profile.timestamp?.toDate().toLocaleString()}</span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Identifiers */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Fingerprint size={12} /> Correlated Identifiers
                    </h5>
                    <div className="space-y-3">
                      <div className="bg-black/30 p-3 rounded border border-[#222]">
                        <p className="text-[9px] text-gray-500 uppercase mb-2">Usernames & Aliases</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.identifiers.usernames.map((u, i) => (
                            <span key={i} className="text-[10px] bg-[#1a1a1a] px-2 py-0.5 rounded text-pink-300">{maskIdentifier('username', u)}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-black/30 p-3 rounded border border-[#222]">
                        <p className="text-[9px] text-gray-500 uppercase mb-2">Email Handles</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.identifiers.emails.map((e, i) => (
                            <span key={i} className="text-[10px] bg-[#1a1a1a] px-2 py-0.5 rounded text-blue-300 flex items-center gap-1">
                              <Mail size={10} /> {maskIdentifier('email', e)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-black/30 p-3 rounded border border-[#222]">
                        <p className="text-[9px] text-gray-500 uppercase mb-2">PGP Fingerprints</p>
                        <div className="space-y-1">
                          {profile.identifiers.pgpFingerprints.map((f, i) => (
                            <p key={i} className="text-[10px] font-mono text-gray-400 break-all">{maskIdentifier('pgp', f)}</p>
                          ))}
                        </div>
                      </div>
                      <div className="bg-black/30 p-3 rounded border border-[#222]">
                        <p className="text-[9px] text-gray-500 uppercase mb-2">Crypto Wallets</p>
                        <div className="space-y-1">
                          {profile.identifiers.wallets.map((w, i) => (
                            <p key={i} className="text-[10px] font-mono text-orange-400 flex items-center gap-1">
                              <Wallet size={10} /> {maskIdentifier('wallet', w)}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stylometrics & Behavior */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <PenTool size={12} /> Stylometric Analysis
                      </h5>
                      <div className="bg-[#1a1a1a] p-4 rounded border border-[#333] space-y-3">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Writing Style</p>
                          <p className="text-xs text-gray-300">{profile.stylometricAnalysis.writingStyle}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Vocabulary & Dialect</p>
                          <p className="text-xs text-gray-300">{profile.stylometricAnalysis.vocabulary}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Dominant Sentiment</p>
                          <p className="text-xs text-gray-300 italic">"{profile.stylometricAnalysis.sentiment}"</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Behavioral Signature
                      </h5>
                      <div className="bg-[#1a1a1a] p-4 rounded border border-[#333] space-y-3">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Activity Cadence</p>
                          <p className="text-xs text-gray-300">{profile.behavioralSignature.activityCadence}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Timezone Inference</p>
                          <p className="text-xs text-white font-bold">{profile.behavioralSignature.timezoneInference}</p>
                        </div>
                        {profile.behavioralSignature.regionalIndicators && (
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase">Regional Indicators</p>
                            <p className="text-xs text-harvest-info italic">{profile.behavioralSignature.regionalIndicators}</p>
                          </div>
                        )}
                        <div className="flex items-start gap-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                          <ShieldAlert size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] text-red-500 uppercase font-bold">OPSEC Assessment</p>
                            <p className="text-[10px] text-gray-300">{profile.behavioralSignature.operationalSecurity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
