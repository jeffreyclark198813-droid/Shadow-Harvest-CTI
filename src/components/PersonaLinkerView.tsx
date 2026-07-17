import React, { useState, useMemo } from 'react';
import { Network, Link as LinkIcon, Check, X, ShieldAlert, Users, GitMerge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdvancedPersonaProfile } from '../services/dbService';
import { Graph, Node as GraphNode, Link as GraphLink } from './Graph';

interface PersonaLinkerViewProps {
  personas: { id: string; label: string }[];
  profiles: AdvancedPersonaProfile[];
  onConfirmLink: (sourceId: string, targetId: string, rationale: string) => void;
  loading: boolean;
}

export const PersonaLinkerView: React.FC<PersonaLinkerViewProps> = ({ personas, profiles, onConfirmLink, loading }) => {
  const [selectedLink, setSelectedLink] = useState<{source: string, sourceLabel: string, target: string, targetLabel: string, reason: string} | null>(null);

  // Compute suggestions based on shared identifiers
  const suggestions = useMemo(() => {
    const links: { source: string, sourceLabel: string, target: string, targetLabel: string, reason: string, confidence: number }[] = [];
    
    for(let i=0; i<profiles.length; i++) {
       for(let j=i+1; j<profiles.length; j++) {
          const p1 = profiles[i];
          const p2 = profiles[j];
          
          let overlap: string[] = [];
          
          const u1 = p1.identifiers?.usernames || [];
          const u2 = p2.identifiers?.usernames || [];
          const matchedUsernames = u1.filter(u => u2.includes(u));
          if (matchedUsernames.length > 0) overlap.push(`Usernames: ${matchedUsernames.join(', ')}`);

          const e1 = p1.identifiers?.emails || [];
          const e2 = p2.identifiers?.emails || [];
          const matchedEmails = e1.filter(e => e2.includes(e));
          if (matchedEmails.length > 0) overlap.push(`Emails: ${matchedEmails.join(', ')}`);

          if (overlap.length > 0) {
             const s1 = personas.find(p => p.id === p1.personaId)?.label || p1.personaId;
             const s2 = personas.find(p => p.id === p2.personaId)?.label || p2.personaId;
             
             links.push({
               source: p1.personaId,
               sourceLabel: s1,
               target: p2.personaId,
               targetLabel: s2,
               reason: `Shared identifiers: ${overlap.join('; ')}`,
               confidence: matchedEmails.length > 0 ? 0.95 : 0.75
             });
          }
       }
    }
    
    return links;
  }, [profiles, personas]);

  // Construct visual graph data
  const { nodes, links } = useMemo(() => {
    const gNodes: GraphNode[] = personas.map(p => ({
      id: p.id,
      label: p.label,
      type: 'persona'
    }));

    const gLinks: GraphLink[] = suggestions.map(s => ({
      source: s.source,
      target: s.target,
      relationship: 'Suggested Link',
      confidence: s.confidence,
      dataSource: 'Persona Correlation Engine'
    }));

    return { nodes: gNodes, links: gLinks };
  }, [personas, suggestions]);

  return (
    <div className="space-y-6 flex flex-col h-[800px]">
      <div className="flex justify-between items-center shrink-0">
        <h3 className="mono-label flex items-center gap-2">
          <Network size={14} className="text-harvest-accent" />
          Persona Mapping & Linker
        </h3>
        <span className="px-2 py-1 bg-harvest-bg border border-harvest-accent text-harvest-accent text-[9px] rounded font-bold uppercase tracking-widest">
          {suggestions.length} Suggested Links
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Suggested Links Panel */}
        <div className="lg:col-span-1 hardware-surface p-4 flex flex-col overflow-hidden">
          <h4 className="mono-label text-white mb-4 border-b border-white/10 pb-2">Correlation Rules Engine</h4>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-[#111] border border-[#222] p-3 rounded hover:border-[#333] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-xs font-bold text-white">{suggestion.sourceLabel}</span>
                  </div>
                  <LinkIcon size={12} className="text-harvest-accent" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{suggestion.targetLabel}</span>
                    <Users size={12} className="text-gray-400" />
                  </div>
                </div>
                
                <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-gray-400 mb-3 border border-[#222]">
                  {suggestion.reason}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${suggestion.confidence > 0.8 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                  </span>
                  
                  <button 
                    onClick={() => setSelectedLink(suggestion)}
                    className="hardware-button px-2 py-1 text-[9px] flex items-center gap-1"
                  >
                    <GitMerge size={10} />
                    Review
                  </button>
                </div>
              </div>
            ))}
            
            {suggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-[10px] uppercase font-mono italic flex flex-col items-center">
                <ShieldAlert size={24} className="mb-2 opacity-50" />
                No unconfirmed links detected.
              </div>
            )}
          </div>
        </div>

        {/* Visual Graph & Review Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
          
          {/* Graph Sandbox */}
          <div className="flex-1 hardware-surface p-1 relative overflow-hidden bg-black/80">
            {nodes.length > 0 ? (
              <Graph nodes={nodes} links={links} isAnalyzing={loading} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs font-mono uppercase">
                Insufficient Entities for Visualization
              </div>
            )}
          </div>

          {/* Action Review Bottom Panel */}
          <AnimatePresence>
            {selectedLink && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="hardware-surface p-4 border-l-4 border-harvest-accent shrink-0"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="mono-label text-white flex items-center gap-2">
                       <ShieldAlert size={14} className="text-harvest-warning" />
                       Confirm Entity Linkage
                    </h5>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Are you sure you want to logically fuse <strong className="text-white">{selectedLink.sourceLabel}</strong> and <strong className="text-white">{selectedLink.targetLabel}</strong>?
                    </p>
                  </div>
                  <button onClick={() => setSelectedLink(null)} className="text-gray-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                
                <div className="bg-[#111] p-3 rounded border border-[#222] text-[10px] font-mono text-gray-300 mb-4 whitespace-pre-wrap">
                   Rationale: {selectedLink.reason}
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      onConfirmLink(selectedLink.source, selectedLink.target, selectedLink.reason);
                      setSelectedLink(null);
                    }}
                    disabled={loading}
                    className="hardware-button-primary px-4 py-2 flex items-center gap-2 text-[10px]"
                  >
                    <Check size={12} />
                    CONFIRM LINKAGE
                  </button>
                  <button 
                    onClick={() => setSelectedLink(null)}
                    disabled={loading}
                    className="hardware-button px-4 py-2 flex items-center gap-2 text-[10px]"
                  >
                    CANCEL
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};
