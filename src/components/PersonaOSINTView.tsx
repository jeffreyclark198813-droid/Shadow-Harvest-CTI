import React from 'react';
import { PersonaOSINT } from '../services/dbService';
import { Globe, Users, MessageSquare, ExternalLink, Search, Code2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PersonaOSINTViewProps {
  osintData: PersonaOSINT[];
  onProfile: (personaId: string, label: string) => void;
  loading: boolean;
  personas: { id: string, label: string }[];
}

export const PersonaOSINTView: React.FC<PersonaOSINTViewProps> = ({ osintData, onProfile, loading, personas }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="mono-label flex items-center gap-2">
          <Globe size={14} className="text-harvest-accent" />
          Extended Persona Intelligence
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Persona List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="hardware-surface p-4">
            <h4 className="mono-label mb-4">Identified Personas</h4>
            <div className="space-y-2">
              {personas.map((persona) => {
                const hasOSINT = osintData.some(o => o.personaId === persona.id);
                return (
                  <button
                    key={persona.id}
                    onClick={() => onProfile(persona.id, persona.label)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      hasOSINT ? 'bg-harvest-accent/5 border-harvest-accent/30 hover:border-harvest-accent/50' : 'bg-white/5 border-harvest-border hover:border-gray-500'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{persona.label}</p>
                      <p className="text-[9px] text-gray-500 uppercase mt-1">
                        {hasOSINT ? 'Profiled' : 'Pending Scan'}
                      </p>
                    </div>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-harvest-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search size={14} className={hasOSINT ? 'text-harvest-accent' : 'text-gray-500'} />
                    )}
                  </button>
                );
              })}
              {personas.length === 0 && (
                <p className="text-[10px] text-gray-600 italic uppercase">No identities resolved</p>
              )}
            </div>
          </div>
        </div>

        {/* OSINT Results */}
        <div className="lg:col-span-3 space-y-6">
          {osintData.length === 0 && !loading && (
            <div className="hardware-surface p-12 text-center text-gray-500">
              <Globe size={48} className="mx-auto mb-4 opacity-20 text-harvest-accent" />
              <p className="mono-label">Select a persona to probe public graphs</p>
              <p className="text-[10px] text-gray-600 mt-2">Searching Dark/Deep/Surface web boundaries</p>
            </div>
          )}

          {osintData.map((osint) => (
            <motion.div
              key={osint.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="hardware-surface !py-2 !px-4 flex items-center gap-3">
                <span className="mono-label !text-harvest-accent">Extraction // {osint.personaId}</span>
                <span className="mono-label !text-gray-500 ml-auto">{osint.timestamp?.toDate().toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {osint.socialProfiles.map((profile, i) => (
                  <div key={i} className="hardware-surface p-5 space-y-4 relative overflow-hidden group hover:border-harvest-accent/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Globe size={64} className="text-harvest-accent" />
                    </div>
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                          <Globe size={18} className="text-harvest-info" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-white uppercase tracking-tighter">{profile.platform}</h5>
                          <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-harvest-info hover:text-harvest-accent transition-colors flex items-center gap-1 font-mono">
                            {profile.url} <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="mono-label !text-[8px] mb-1">Connections</p>
                         <p className="text-lg font-bold text-harvest-accent font-mono">{profile.connectionsCount}</p>
                      </div>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-harvest-border">
                      <p className="text-xs text-gray-300 leading-relaxed min-h-[40px]">
                        {profile.description}
                      </p>
                    </div>

                    {profile.technicalSignatures && profile.technicalSignatures.length > 0 && (
                      <div className="relative z-10 bg-harvest-bg/50 p-3 rounded-lg border border-harvest-border">
                        <div className="mono-label !text-harvest-warning mb-2 flex items-center gap-2">
                           <Code2 size={12} /> Tech Substrate
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.technicalSignatures.map((sig, k) => (
                             <span key={k} className="text-[9px] px-2 py-1 bg-harvest-warning/10 text-harvest-warning border border-harvest-warning/20 rounded font-mono uppercase">
                               {sig}
                             </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 relative z-10 pt-2">
                      <div className="mono-label !text-gray-400 flex items-center gap-2">
                         <MessageSquare size={12} /> Live telemetry
                      </div>
                      <div className="space-y-2">
                        {profile.recentPosts.map((post, j) => (
                          <div key={j} className="bg-white/5 p-3 rounded-lg border-l-2 border-harvest-accent/50 text-[11px] text-gray-400 font-mono leading-relaxed">
                            {post}
                          </div>
                        ))}
                        {profile.recentPosts.length === 0 && (
                          <div className="text-[10px] text-gray-600 italic p-2">No telemetry captured.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
