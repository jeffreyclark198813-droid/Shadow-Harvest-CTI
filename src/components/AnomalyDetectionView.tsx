import React, { useState } from 'react';
import { Anomaly, addAnomaly, resolveAnomaly, AIPersona } from '../services/dbService';
import { detectAnomalies } from '../services/geminiService';
import { 
  ShieldAlert, Activity, AlertTriangle, CheckCircle2, 
  Loader2, Zap, Search, Terminal, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnomalyDetectionViewProps {
  targetId: string;
  targetName: string;
  anomalies: Anomaly[];
  intelligenceContext: string;
  persona?: AIPersona;
  loading?: boolean;
}

export const AnomalyDetectionView: React.FC<AnomalyDetectionViewProps> = ({
  targetId,
  targetName,
  anomalies,
  intelligenceContext,
  persona
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('all');

  const runDetection = async () => {
    if (!intelligenceContext) return;
    setIsScanning(true);
    try {
      const result = await detectAnomalies(targetName, intelligenceContext, persona);
      const anomalyList = result?.anomalies && Array.isArray(result.anomalies) ? result.anomalies : [];
      for (const anomaly of anomalyList) {
        await addAnomaly({
          targetId,
          ...anomaly
        });
      }
    } catch (error) {
      console.error("Anomaly detection failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredAnomalies = anomalies
    .filter(a => filter === 'all' || !a.resolved)
    .sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 border-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      default: return 'text-blue-500 border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert size={14} className="text-red-500" />
          Anomaly Detection Engine
        </h3>
        <div className="flex gap-3">
          <div className="flex bg-[#111] border border-[#222] rounded p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${
                filter === 'all' ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unresolved')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${
                filter === 'unresolved' ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Unresolved
            </button>
          </div>
          <button
            onClick={runDetection}
            disabled={isScanning || !intelligenceContext}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            INITIATE SCAN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAnomalies.map((anomaly) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={anomaly.id}
              className={`p-4 rounded border transition-all ${
                anomaly.resolved ? 'bg-[#0a0a0a] border-[#222] opacity-60' : 'bg-[#111] border-[#222] hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase ${getSeverityColor(anomaly.severity)}`}>
                    {anomaly.severity}
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {anomaly.type.replace('_', ' ')} Deviation
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-gray-600">{anomaly.timestamp?.toDate().toLocaleString()}</span>
                  {!anomaly.resolved && (
                    <button
                      onClick={() => resolveAnomaly(targetId, anomaly.id!)}
                      className="text-[9px] font-bold text-green-500 hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 size={10} /> RESOLVE
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                {anomaly.description}
              </p>

              <div className="bg-black/50 border border-[#222] rounded p-3">
                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase mb-2">
                  <Terminal size={10} /> Evidence Artifact
                </div>
                <pre className="text-[10px] text-[#00ff00] font-mono whitespace-pre-wrap">
                  {anomaly.evidence}
                </pre>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAnomalies.length === 0 && !isScanning && (
          <div className="h-64 border border-[#222] border-dashed rounded-lg flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
              <Activity size={32} className="text-gray-700" />
            </div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">No Anomalies Detected</h4>
            <p className="text-xs text-gray-600 max-w-xs">
              Initiate a scan to analyze network traffic, user activity, and financial flows for deviations from baseline behavior.
            </p>
          </div>
        )}

        {isScanning && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="text-red-500 animate-spin" />
            <p className="text-[10px] font-bold text-gray-500 uppercase animate-pulse">
              Analyzing data streams for behavioral deviations...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
