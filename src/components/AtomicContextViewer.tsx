import React from 'react';
import { motion } from 'motion/react';
import { Activity, Shield, Binary, Database, Cpu, Zap } from 'lucide-react';
import { ConfidenceLevel, ReliabilityMetric } from '../types/atomic';

interface Props {
  metrics: ReliabilityMetric[];
}

export const AtomicContextViewer: React.FC<Props> = ({ metrics }) => {
  const avgLatency = metrics.length > 0 
    ? metrics.reduce((acc, m) => acc + m.latency_ms, 0) / metrics.length 
    : 0;

  const avgEfficiency = metrics.length > 0
    ? metrics.reduce((acc, m) => acc + m.token_efficiency, 0) / metrics.length
    : 0;

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg font-mono text-[10px] text-zinc-400">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Binary className="text-emerald-500" size={16} />
          <h2 className="text-zinc-100 uppercase tracking-[0.2em] font-bold">Atomic Telemetry Dashboard</h2>
        </div>
        <div className="flex items-center gap-4 text-[8px] uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500">System Live</span>
          </div>
          <span className="text-zinc-600">v1.4.2-alpha</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Zap size={12} />
            <span>AVG LATENCY</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{avgLatency.toFixed(2)}ms</div>
          <div className="text-[8px] text-zinc-600">Deterministic Response Vector</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Cpu size={12} />
            <span>TOKEN EFFICIENCY</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{(avgEfficiency * 100).toFixed(1)}%</div>
          <div className="text-[8px] text-zinc-600">Shannon Entropy Minimization</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Activity size={12} />
            <span>RELIABILITY SCORE</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{(100 - (metrics[0]?.failure_rate || 0) * 100).toFixed(1)}%</div>
          <div className="text-[8px] text-zinc-600">Bayesian Probability Bound</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-800 pb-2 mb-4">
          <span>ATOMIC ARTIFACT INVENTORY</span>
          <span>PROVENANCE</span>
        </div>
        
        {metrics.map((metric, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between group hover:bg-zinc-900/30 p-2 rounded transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-zinc-600 w-4">0{i+1}</span>
              <span className="text-zinc-300 uppercase tracking-wider">{metric.model_id}</span>
              <span className="text-zinc-600">[{metric.latency_ms}ms]</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] border ${
                metric.retry_count === 0 ? 'border-emerald-500/30 text-emerald-500' : 'border-amber-500/30 text-amber-500'
              }`}>
                {metric.retry_count === 0 ? 'DETERMINISTIC' : `RETRY_L${metric.retry_count}`}
              </span>
              <Database size={10} className="text-zinc-700" />
            </div>
          </motion.div>
        ))}

        {metrics.length === 0 && (
          <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800 rounded">
            <span className="text-zinc-700 animate-pulse uppercase tracking-[0.3em]">Awaiting Data Stream...</span>
          </div>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800 flex items-start gap-4">
        <Shield size={24} className="text-emerald-500/50 flex-shrink-0" />
        <div className="space-y-1">
          <h3 className="text-zinc-100 uppercase tracking-widest text-[9px]">Architectural Invariants Policy</h3>
          <p className="text-zinc-500 text-[8px] leading-relaxed">
            All artifacts are subjected to multi-vector verification. Entropy scores exceeding 0.85 trigger autonomous 
            re-resolution cycles. This environment operates under strictly non-regressive functional modalities.
            Data provenance is immutable and cryptographically linked to neural link signatures.
          </p>
        </div>
      </div>
    </div>
  );
};
