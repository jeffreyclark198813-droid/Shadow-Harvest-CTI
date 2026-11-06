import React, { useState, useEffect } from 'react';
import { GitBranch, Box, ArrowRight, ShieldCheck, Clock, Layers } from 'lucide-react';
import { ArtifactProvenance } from '../types/intelligence_ops';
import { fetchProvenanceLineage } from '../services/dbService';
import { motion, AnimatePresence } from 'motion/react';

interface ProvenanceVisualizerProps {
  artifactId: string;
}

export const ProvenanceVisualizer: React.FC<ProvenanceVisualizerProps> = ({ artifactId }) => {
  const [lineage, setLineage] = useState<ArtifactProvenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactProvenance | null>(null);

  useEffect(() => {
    const loadLineage = async () => {
      setLoading(true);
      try {
        const data = await fetchProvenanceLineage(artifactId);
        setLineage(data);
        const root = data.find(d => d.artifactId === artifactId);
        if (root) setSelectedArtifact(root);
      } catch (err) {
        console.error('[ProvenanceVisualizer] Failed to fetch lineage:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLineage();
  }, [artifactId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-8 h-8 border-2 border-harvest-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Resolving T0-T1-T2 Lineage...</span>
      </div>
    );
  }

  // T-levels mapping
  const levels = {
    T2: lineage.filter(l => l.level === 'T2'),
    T1: lineage.filter(l => l.level === 'T1'),
    T0: lineage.filter(l => l.level === 'T0')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-harvest-accent/10 rounded-lg">
            <GitBranch className="text-harvest-accent" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Provenance Graph</h3>
            <p className="text-[10px] text-gray-500 font-mono">INTEGRITY RESOLUTION PROTOCOL v1.2</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['T2', 'T1', 'T0'].map(t => (
            <div key={t} className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-harvest-border rounded text-[9px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${t === 'T2' ? 'bg-blue-500' : t === 'T1' ? 'bg-purple-500' : 'bg-harvest-accent'}`} />
              <span className="text-gray-400">{t} LAYER</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
        {/* T2: Derived Layer */}
        <div className="space-y-3">
          <LayerColumn title="Derived (T2)" items={levels.T2} selectedId={selectedArtifact?.artifactId} onSelect={setSelectedArtifact} color="border-blue-500/30" />
        </div>
        {/* T1: Normalized Layer */}
        <div className="space-y-3">
          <LayerColumn title="Normalized (T1)" items={levels.T1} selectedId={selectedArtifact?.artifactId} onSelect={setSelectedArtifact} color="border-purple-500/30" />
        </div>
        {/* T0: Ingested Layer */}
        <div className="space-y-3">
          <LayerColumn title="Ingested (T0)" items={levels.T0} selectedId={selectedArtifact?.artifactId} onSelect={setSelectedArtifact} color="border-harvest-accent/30" />
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence mode="wait">
        {selectedArtifact && (
          <motion.div
            key={selectedArtifact.artifactId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-harvest-card border border-harvest-border rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-harvest-accent" />
                <span className="text-xs font-bold text-white font-mono uppercase">{selectedArtifact.artifactId}</span>
              </div>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                selectedArtifact.level === 'T2' ? 'bg-blue-500/20 text-blue-400' : 
                selectedArtifact.level === 'T1' ? 'bg-purple-500/20 text-purple-400' : 
                'bg-harvest-accent/20 text-harvest-accent'
              }`}>
                {selectedArtifact.level} PERSISTENCE
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Source Provenance</span>
                <div className="text-xs text-gray-300 bg-black/20 p-2 rounded border border-harvest-border/50 font-mono">
                  {selectedArtifact.source}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Cryptographic Hash (SHA-256)</span>
                <div className="text-xs text-gray-300 bg-black/20 p-2 rounded border border-harvest-border/50 font-mono break-all">
                  {selectedArtifact.hash}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Transformation Logic</span>
              <p className="text-xs text-gray-400 leading-relaxed italic">
                "{selectedArtifact.transformation}"
              </p>
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-harvest-border/50">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-harvest-accent" />
                <span className="text-[10px] text-gray-400 font-mono">VALIDATED INTEGRITY</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 font-mono">
                  {selectedArtifact.timestamp?.toDate().toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LayerColumn: React.FC<{ 
  title: string; 
  items: ArtifactProvenance[]; 
  selectedId?: string;
  onSelect: (a: ArtifactProvenance) => void;
  color: string;
}> = ({ title, items, selectedId, onSelect, color }) => (
  <div className={`flex flex-col h-full bg-black/20 rounded-2xl border ${color} overflow-hidden`}>
    <div className="px-4 py-2 border-b border-harvest-border/50 bg-black/40">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
    </div>
    <div className="p-2 space-y-2 overflow-y-auto max-h-[350px]">
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <span className="text-[10px] font-mono text-gray-600 italic uppercase">No nodes at this depth</span>
        </div>
      ) : (
        items.map(item => (
          <button
            key={item.artifactId}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${
              selectedId === item.artifactId 
                ? 'bg-harvest-accent/10 border-harvest-accent shadow-[0_0_15px_rgba(255,166,0,0.1)]' 
                : 'bg-black/40 border-harvest-border hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-mono font-bold tracking-tight truncate max-w-[120px] ${
                selectedId === item.artifactId ? 'text-harvest-accent' : 'text-gray-300'
              }`}>
                {item.artifactId}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={10} className="text-harvest-accent" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono">
              <Layers size={8} />
              <span>{item.source.split(' ')[0]}</span>
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);
