import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TemporalDrift } from '../types/intelligence_ops';
import { subscribeToTemporalDrifts, reconcileTemporalDrift } from '../services/dbService';
import { auth } from '../firebase';
import { Clock, AlertTriangle, CheckCircle2, History, Sliders, ChevronRight, Activity } from 'lucide-react';

export const TemporalEngine: React.FC = () => {
  const [drifts, setDrifts] = useState<TemporalDrift[]>([]);
  const [selectedDrift, setSelectedDrift] = useState<TemporalDrift | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [reconciledIds, setReconciledIds] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeToTemporalDrifts(setDrifts);
    return () => unsub();
  }, []);

  // Mock data if empty
  const rawDrifts = drifts.length > 0 ? drifts : [
    {
      id: 'drift-1',
      artifactAId: 'art-001',
      artifactAName: 'CCTV Feed Alpha',
      artifactBId: 'art-002',
      artifactBName: 'Egress Logs Node 7',
      driftMs: 3450,
      status: 'flagged' as const,
      adjustedMs: 0
    },
    {
      id: 'drift-2',
      artifactAId: 'art-005',
      artifactAName: 'Wallet TX Hash 0x7',
      artifactBId: 'art-006',
      artifactBName: 'Discord Message Trace',
      driftMs: -1200,
      status: 'flagged' as const,
      adjustedMs: 0
    }
  ];

  const displayDrifts = rawDrifts.filter(d => !reconciledIds.includes(d.id || ''));

  const handleReconcile = async () => {
    if (!selectedDrift || !selectedDrift.id) return;
    const user = auth.currentUser;
    if (!user) return;

    setIsProcessing(true);
    try {
      await reconcileTemporalDrift(selectedDrift.id, adjustmentValue, user.uid, selectedDrift);
      setReconciledIds(prev => [...prev, selectedDrift.id!]);
    } catch (err) {
      console.error('Error reconciling drift:', err);
    } finally {
      setIsProcessing(false);
      setSelectedDrift(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="mono-label text-gray-400 flex items-center gap-2">
            <Clock size={12} className="text-harvest-accent" />
            FLAGGED TIMESTAMP DRIFTS ({displayDrifts.length})
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-harvest-accent animate-pulse" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Temporal Sync: Active</span>
             </div>
          </div>
        </div>

        <div className="space-y-3">
          {displayDrifts.length === 0 ? (
            <div className="hardware-surface p-8 text-center bg-black/40 border-dashed border-[#333] space-y-3">
              <CheckCircle2 size={32} className="text-harvest-accent mx-auto" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">All Temporal Drifts Reconciled</h4>
              <p className="text-[10px] text-gray-500 font-mono">T0 evidence sequence synchronization is currently at 100% coherence.</p>
            </div>
          ) : (
            displayDrifts.map((drift) => (
              <motion.div
                key={drift.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setSelectedDrift(drift);
                  setAdjustmentValue(drift.driftMs * -1);
                }}
                className={`hardware-surface p-4 flex items-center justify-between cursor-pointer transition-all ${
                  selectedDrift?.id === drift.id ? 'ring-2 ring-harvest-accent/50 bg-harvest-accent/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-harvest-border z-10">
                      <History size={16} className="text-harvest-accent" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center border border-harvest-border">
                      <Activity size={16} className="text-blue-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tighter">
                      {drift.artifactAName} <span className="text-gray-600 font-mono text-[10px] mx-2">↔</span> {drift.artifactBName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-mono text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">
                        DRIFT: {drift.driftMs > 0 ? `+${drift.driftMs}` : drift.driftMs}ms
                      </span>
                      <span className="mono-label !text-[8px]">DIVERGENCE DETECTED IN T0 SEQUENCING</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className={selectedDrift?.id === drift.id ? 'text-harvest-accent' : 'text-gray-700'} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="mono-label text-gray-400 flex items-center gap-2">
          <Sliders size={12} className="text-harvest-accent" />
          RESOLUTION INTERFACE
        </h2>

        <AnimatePresence mode="wait">
          {selectedDrift ? (
            <motion.div
              key="interface"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hardware-surface p-6 space-y-6 bg-harvest-card"
            >
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Manual Reconciliation</h3>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Adjust the temporal offset to synchronize {selectedDrift.artifactAName} with its related evidence artifact.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-harvest-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-600 font-bold">CURRENT OFFSET</span>
                  <span className="text-xs font-mono text-red-500 font-bold">{selectedDrift.driftMs}ms</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-500">ADJUSTMENT</span>
                    <span className="text-harvest-accent">{adjustmentValue > 0 ? `+${adjustmentValue}` : adjustmentValue}ms</span>
                  </div>
                  <input 
                    type="range" 
                    min={-5000} 
                    max={5000} 
                    step={10}
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-harvest-accent"
                  />
                  <div className="flex justify-between text-[8px] text-gray-700 font-bold uppercase tracking-tighter">
                    <span>-5000ms</span>
                    <span>Neutral</span>
                    <span>+5000ms</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-harvest-border">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white font-bold">PROJECTED DRIFT</span>
                    <span className={`text-xs font-mono font-bold ${Math.abs(selectedDrift.driftMs + adjustmentValue) < 100 ? 'text-harvest-accent' : 'text-yellow-500'}`}>
                      {selectedDrift.driftMs + adjustmentValue}ms
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-yellow-500/80 leading-tight">
                  Reconciliation actions are logged to the immutable audit trail and will influence the downstream inference probability scores.
                </p>
              </div>

              <button
                onClick={handleReconcile}
                disabled={isProcessing}
                className="hardware-button-primary w-full py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Activity size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                COMMIT ADJUSTMENT
              </button>

              <button
                onClick={() => setSelectedDrift(null)}
                className="w-full py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white transition-colors"
              >
                ABORT RESOLUTION
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hardware-surface p-12 text-center bg-transparent border-dashed flex flex-col items-center justify-center space-y-4"
            >
              <History size={32} className="text-gray-800" />
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Select a drift anomaly to begin resolution protocol</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
