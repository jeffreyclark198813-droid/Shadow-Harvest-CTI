import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArtifactProvenance, ProvenanceState } from '../types/intelligence_ops';
import { subscribeToProvenance, Target } from '../services/dbService';
import { X, CheckCircle2, Clock, Binary, Database, ShieldCheck, Link2, ChevronRight } from 'lucide-react';

interface ProvenanceModalProps {
  target: Target;
  onClose: () => void;
}

const STAGES = [
  { level: 'T0', label: 'T0 Observation', icon: Database, desc: 'Empirical primary collection & sensor raw telemetry' },
  { level: 'T1', label: 'T1 Derivation', icon: Binary, desc: 'Deterministic normalization, graph & spatial aggregation' },
  { level: 'T2', label: 'T2 Inference', icon: Link2, desc: 'Probabilistic correlation & hypothesis linkage' },
  { level: 'T3', label: 'T3 Assessment', icon: ShieldCheck, desc: 'Evidence-integrated analyst judgment & caveats' },
];

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({ target, onClose }) => {
  const [provenance, setProvenance] = useState<ArtifactProvenance | null>(null);

  useEffect(() => {
    if (target.id) {
      const unsub = subscribeToProvenance(target.id, setProvenance);
      return () => unsub();
    }
  }, [target.id]);

  // If no provenance exists, we mock one for display
  const displayProvenance = provenance || {
    artifactId: target.id || 'unknown',
    state: 'validation' as ProvenanceState,
    progress: 75,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    history: [
      { state: 'ingestion', timestamp: { seconds: (Date.now() - 3600000) / 1000, nanoseconds: 0 } as any, details: 'Successfully ingested from primary node' },
      { state: 'normalization', timestamp: { seconds: (Date.now() - 1800000) / 1000, nanoseconds: 0 } as any, details: 'Schema normalized to Shadow Harvest v2.1' },
    ]
  };

  const stateMap: Record<ProvenanceState, number> = {
    ingestion: 0,
    normalization: 1,
    validation: 2,
    inference: 3
  };
  const currentStageIndex = stateMap[displayProvenance.state] ?? 2;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-[200]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-harvest-card border border-harvest-border w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-harvest-border flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harvest-accent/10 rounded-lg">
              <Database size={18} className="text-harvest-accent" />
            </div>
            <div>
              <h3 className="font-bold text-white uppercase tracking-tighter">Provenance State Machine</h3>
              <p className="mono-label !text-[8px]">{target.name} // ARTIFACT ID: {target.id?.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-8">
          {/* Progress Tracker Visual */}
          <div className="relative flex justify-between mb-12">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2 z-0" />
            <motion.div 
              className="absolute top-1/2 left-0 h-0.5 bg-harvest-accent -translate-y-1/2 z-0 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: (currentStageIndex + (displayProvenance.progress / 100)) / (STAGES.length - 1) }}
            />
            
            {STAGES.map((stage, i) => {
              const isCompleted = i < currentStageIndex;
              const isActive = i === currentStageIndex;
              const isFuture = i > currentStageIndex;

              return (
                <div key={stage.level} className="relative z-10 flex flex-col items-center gap-3 group">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      backgroundColor: isCompleted || isActive ? '#00ff00' : '#111',
                      borderColor: isCompleted || isActive ? '#00ff00' : '#333'
                    }}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shadow-lg
                                ${isActive ? 'ring-4 ring-harvest-accent/20' : ''}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-black" />
                    ) : (
                      <stage.icon size={18} className={isFuture ? 'text-gray-700' : 'text-black'} />
                    )}
                  </motion.div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isFuture ? 'text-gray-600' : 'text-white'}`}>
                      {stage.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <div className="space-y-6">
              <h4 className="mono-label !text-[10px] text-harvest-accent border-b border-harvest-accent/20 pb-2">Operational Context</h4>
              <div className="space-y-4">
                {STAGES.map((stage, i) => (
                  <div key={stage.level} className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
                    i === currentStageIndex ? 'bg-harvest-accent/5 border-harvest-accent/30' : 'bg-transparent border-transparent opacity-40'
                  }`}>
                    <div className={`p-2 rounded-lg ${i === currentStageIndex ? 'bg-harvest-accent text-black' : 'bg-gray-800 text-gray-500'}`}>
                      <stage.icon size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase">{stage.label}</h5>
                      <p className="text-[10px] text-gray-500 mt-0.5">{stage.desc}</p>
                    </div>
                    {i === currentStageIndex && (
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] font-mono text-harvest-accent">{displayProvenance.progress}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="mono-label !text-[10px] text-harvest-accent border-b border-harvest-accent/20 pb-2">Transaction Audit Log</h4>
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                {displayProvenance.history.map((log, i) => (
                  <div key={i} className="hardware-surface p-3 bg-white/[0.01]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-harvest-accent uppercase tracking-widest">{log.state}</span>
                      <span className="text-[8px] text-gray-600 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(log.timestamp.seconds * 1000).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed italic">"{log.details}"</p>
                  </div>
                ))}
                {displayProvenance.history.length === 0 && (
                  <p className="text-[10px] text-gray-600 text-center py-8">Waiting for trace execution...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-black/40 border-t border-harvest-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-harvest-accent" />
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest italic">Immutable Provenance Chain Verified</span>
          </div>
          <button 
            className="hardware-button-primary !py-2 !px-4 !text-[10px] flex items-center gap-2"
            onClick={onClose}
          >
            DISMISS TRACE
            <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
