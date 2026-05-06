import React, { useState } from 'react';
import { Target } from '../services/dbService';
import { Bitcoin, Activity, Link, Layers, AlertCircle, Cpu } from 'lucide-react';
import { traceFinancialFlows } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialTracingViewProps {
  target: Target;
}

export const FinancialTracingView: React.FC<FinancialTracingViewProps> = ({ target }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleTrace = async () => {
    setLoading(true);
    try {
      // Pass relevant context that might include wallet info
      const data = await traceFinancialFlows(JSON.stringify(target));
      setResults(data);
    } catch (error) {
      console.error("Financial tracing failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="mono-label flex items-center gap-2">
          <Bitcoin size={14} className="text-yellow-500" />
          Advanced Financial Tracing
        </h3>
        <button
          onClick={handleTrace}
          disabled={loading}
          className="hardware-button px-4 py-2 flex items-center gap-2"
        >
          {loading ? <Cpu size={14} className="animate-spin" /> : <Activity size={14} />}
          {loading ? "ANALYZING LEDGER..." : "LAUNCH TRACING"}
        </button>
      </div>

      {!results && !loading && (
        <div className="hardware-surface p-12 text-center text-gray-500">
          <Bitcoin size={48} className="mx-auto mb-4 opacity-20 text-yellow-500" />
          <p className="mono-label">No ledger data traced.</p>
          <p className="text-[10px] text-gray-600 mt-2">Initialize tracing to cluster wallets and identify mixer interactions.</p>
        </div>
      )}

      {loading && (
        <div className="hardware-surface p-12 text-center text-yellow-500 animate-pulse">
          <Activity size={48} className="mx-auto mb-4" />
          <p className="mono-label">Computing topological graph of transaction flows...</p>
        </div>
      )}

      <AnimatePresence>
        {results && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-4">
              <h4 className="mono-label mb-2 text-yellow-500">Tracer Summary</h4>
              <p className="text-xs text-gray-300 font-mono leading-relaxed">{results.summary}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Flow Analysis */}
              <div className="hardware-surface p-4 border-l-2 border-l-blue-500">
                <h4 className="mono-label mb-4 flex items-center gap-2"><Link size={14} className="text-blue-500" /> Interaction Flows</h4>
                <div className="space-y-3">
                  {results.flowAnalysis?.map((flow: any, idx: number) => (
                    <div key={idx} className="bg-black/50 p-3 rounded border border-white/5 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="text-gray-400 truncate w-32" title={flow.sourceWallet}>{flow.sourceWallet.substring(0, 8)}...</span>
                        <span className="text-yellow-500 font-bold px-2 py-0.5 bg-yellow-500/10 rounded">{flow.volume}</span>
                        <span className="text-gray-400 truncate w-32 text-right" title={flow.destinationWallet}>...{flow.destinationWallet.substring(flow.destinationWallet.length - 8)}</span>
                      </div>
                      <p className="text-[9px] text-blue-400 mt-2">
                        {flow.notableInteraction}
                      </p>
                    </div>
                  ))}
                  {(!results.flowAnalysis || results.flowAnalysis.length === 0) && (
                    <p className="text-[10px] text-gray-500 italic">No significant flows detected.</p>
                  )}
                </div>
              </div>

              {/* Wallet Clusters */}
              <div className="hardware-surface p-4 border-l-2 border-l-harvest-accent">
                <h4 className="mono-label mb-4 flex items-center gap-2"><Layers size={14} className="text-harvest-accent" /> Clustered Identities</h4>
                <div className="space-y-3">
                  {results.walletClusters?.map((cluster: any, idx: number) => (
                    <div key={idx} className="bg-black/50 p-3 rounded border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white font-bold">{cluster.clusterId}</span>
                        <span className="text-harvest-accent bg-harvest-accent/10 px-2 py-0.5 rounded font-mono uppercase">{cluster.behaviorType}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cluster.wallets.map((w: string, wId: number) => (
                          <span key={wId} className="text-[8px] text-gray-400 bg-[#111] px-1 py-0.5 rounded border border-[#333] font-mono" title={w}>
                            {w.substring(0, 6)}..
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!results.walletClusters || results.walletClusters.length === 0) && (
                    <p className="text-[10px] text-gray-500 italic">No clusters mapped.</p>
                  )}
                </div>
              </div>

              {/* Flagged Cross-References */}
              <div className="hardware-surface p-4 lg:col-span-2 border-l-2 border-l-red-500 bg-red-900/5">
                <h4 className="mono-label mb-4 flex items-center gap-2 text-red-500"><AlertCircle size={14} /> Sanction & Flagged Matches</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.flaggedCrossReferences?.map((flag: any, idx: number) => (
                    <div key={idx} className="bg-black/50 p-3 rounded border border-red-500/20 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-white truncate" title={flag.wallet}>{flag.wallet}</span>
                        {flag.sanctionMatch && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded border bg-red-500/20 text-red-500 border-red-500/30 tracking-widest uppercase">
                            SANCTIONED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-red-400/80 leading-relaxed">
                        {flag.details}
                      </p>
                    </div>
                  ))}
                  {(!results.flaggedCrossReferences || results.flaggedCrossReferences.length === 0) && (
                    <p className="text-[10px] text-gray-500 italic lg:col-span-2">No sanctioned or flagged wallet interactions identified.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
