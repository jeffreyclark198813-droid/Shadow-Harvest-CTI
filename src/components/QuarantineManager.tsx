import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Eye, ShieldCheck, Info, Database, Fingerprint, Calendar } from 'lucide-react';
import { QuarantineEntry } from '../types/intelligence_ops';
import { subscribeToQuarantine, deleteFromQuarantine } from '../services/dbService';
import { motion, AnimatePresence } from 'motion/react';

export const QuarantineManager: React.FC = () => {
  const [entries, setEntries] = useState<QuarantineEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<QuarantineEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToQuarantine((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const handlePurge = async (id: string) => {
    if (confirm('Are you sure you want to permanently purge this quarantined artifact? This action cannot be undone.')) {
      try {
        await deleteFromQuarantine(id);
        if (selectedEntry?.id === id) setSelectedEntry(null);
      } catch (err) {
        console.error('[QuarantineManager] Failed to purge entry:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest text-red-500/70">Scanning Quarantine Vault...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <ShieldAlert className="text-red-500" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quarantine Vault</h3>
            <p className="text-[10px] text-gray-500 font-mono">ISOLATED ARTIFACTS - SECTION 33 COMPLIANCE</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
          <span className="text-[10px] font-bold text-red-400 font-mono">{entries.length} REJECTED ITEMS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Isolated Artifacts</div>
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {entries.length === 0 ? (
              <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-harvest-border">
                <ShieldCheck size={32} className="mx-auto text-harvest-accent/30 mb-3" />
                <p className="text-xs text-gray-500 font-mono italic">No artifacts currently in quarantine. Perimeter secure.</p>
              </div>
            ) : (
              entries.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                    selectedEntry?.id === entry.id
                      ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                      : 'bg-black/40 border-harvest-border hover:border-red-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400 truncate max-w-[200px]">
                      {entry.artifactId || 'UNIDENTIFIED_HASH'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-900/20 text-red-400 rounded font-bold border border-red-900/30 uppercase">
                      Rejected
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 font-medium mb-3 line-clamp-1">{entry.reason}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono">
                      <Calendar size={10} />
                      <span>{entry.timestamp?.toDate().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trash2 
                        size={12} 
                        className="text-gray-600 hover:text-red-500 transition-colors" 
                        onClick={(e) => { e.stopPropagation(); handlePurge(entry.id!); }}
                      />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedEntry ? (
              <motion.div
                key={selectedEntry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-harvest-card border border-red-900/30 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-red-950/20 border-b border-red-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <Eye className="text-red-400" size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Artifact Inspection</h4>
                        <p className="text-[9px] text-red-500/70 font-mono uppercase font-bold">Caution: Raw telemetry contents below</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handlePurge(selectedEntry.id!)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 hover:bg-red-800/40 text-red-400 border border-red-900/40 rounded-xl text-[10px] font-bold transition-all uppercase tracking-wider"
                    >
                      <Trash2 size={12} />
                      Purge Vault
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="p-3 bg-black/40 rounded-xl border border-red-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Fingerprint size={12} className="text-red-400" />
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Original Hash</span>
                      </div>
                      <div className="text-[10px] text-gray-300 font-mono truncate">{selectedEntry.originalHash}</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-red-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Database size={12} className="text-red-400" />
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Detection Engine</span>
                      </div>
                      <div className="text-[10px] text-gray-300 font-mono">{selectedEntry.detectorId}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="text-red-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rejection Rationale</span>
                    </div>
                    <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-xl text-xs text-red-200/90 leading-relaxed font-mono">
                      {selectedEntry.reason}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-red-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Raw Artifact Metadata</span>
                    </div>
                    <div className="p-4 bg-black/60 border border-harvest-border/30 rounded-xl text-[10px] text-gray-400 font-mono overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-[200px]">
                      {JSON.stringify(selectedEntry.metadata, null, 2)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-black/20 rounded-3xl border border-dashed border-harvest-border opacity-60">
                <Eye size={48} className="text-harvest-accent/20 mb-4" />
                <p className="text-xs text-gray-500 font-mono text-center uppercase tracking-widest">Select an artifact from the vault for microscopic inspection</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
