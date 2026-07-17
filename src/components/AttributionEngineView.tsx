import React from 'react';
import { AttributionReport } from '../services/dbService';
import { Share2, Map, Activity, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface AttributionEngineViewProps {
  reports: AttributionReport[];
  onGenerate: () => void;
  loading: boolean;
}

export const AttributionEngineView: React.FC<AttributionEngineViewProps> = ({ reports, onGenerate, loading }) => {
  const latest = reports[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Share2 size={14} className="text-blue-500" />
          Correlation & Attribution Engine
        </h3>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'CORRELATING...' : 'RUN ATTRIBUTION ENGINE'}
        </button>
      </div>

      {!latest && !loading && (
        <div className="bg-[#111] border border-[#222] p-12 rounded text-center">
          <Share2 size={48} className="mx-auto text-gray-800 mb-4" />
          <p className="text-sm text-gray-500 uppercase tracking-widest">Initiate attribution engine to correlate infrastructure, identities, and flows</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="h-64 bg-[#111] border border-[#222] rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-[#111] border border-[#222] rounded animate-pulse" />
            <div className="h-48 bg-[#111] border border-[#222] rounded animate-pulse" />
          </div>
        </div>
      )}

      {latest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary & Confidence */}
          <div className="bg-[#111] border border-[#222] p-6 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Attribution Confidence</p>
                <p className={`text-3xl font-bold ${
                  latest.confidenceScore > 80 ? 'text-[#00ff00]' : latest.confidenceScore > 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {latest.confidenceScore}%
                </p>
              </div>
            </div>
            
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase">
                <ShieldCheck size={16} />
                Executive Summary
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {latest.summary}
              </p>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded">
                <span className="text-[10px] text-blue-400 uppercase font-bold">Likely Attribution:</span>
                <span className="text-xs text-white font-bold uppercase tracking-wider">{latest.likelyAttribution}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Reliability Matrix */}
            <div className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-4 col-span-1 md:col-span-2 mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase">
                <ShieldCheck size={16} />
                Source Reliability Matrix
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { source: 'Technical Infrastructure (DNS/IP)', reliability: 0.95, weight: 'High' },
                  { source: 'Financial Ledgers (Blockchain)', reliability: 0.98, weight: 'High' },
                  { source: 'OSINT & Social Graph', reliability: 0.65, weight: 'Medium' },
                  { source: 'Behavioral/Sentiment Inference', reliability: 0.45, weight: 'Low' }
                ].map((matrix, idx) => (
                  <div key={idx} className="bg-black/30 p-4 rounded border border-[#222]">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{matrix.source}</div>
                    <div className="flex justify-between items-end">
                      <div className="text-lg font-bold text-white">{(matrix.reliability * 100).toFixed(0)}%</div>
                      <div className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        matrix.weight === 'High' ? 'bg-green-500/20 text-green-400' :
                        matrix.weight === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {matrix.weight}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase">
                <Map size={16} />
                Geotemporal Analysis
              </div>
              <div className="bg-black/30 p-4 rounded border border-[#222] min-h-[120px]">
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  {latest.geotemporalAnalysis}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Infrastructure
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Activity Cadence
                </div>
              </div>
            </div>

            {/* Behavioral Correlations */}
            <div className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase">
                <Activity size={16} />
                Behavioral Correlations
              </div>
              <div className="bg-black/30 p-4 rounded border border-[#222] min-h-[120px]">
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  {latest.behavioralCorrelations}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-orange-500 bg-orange-500/10 p-2 rounded border border-orange-500/20">
                <AlertTriangle size={12} />
                Anomalous patterns detected in financial flow vs infrastructure usage.
              </div>
            </div>
          </div>

          {/* Unified Intelligence Graph Placeholder/Hint */}
          <div className="bg-[#111] border border-[#222] p-6 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded flex items-center justify-center">
                <TrendingUp size={24} className="text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase">Unified Intelligence Graph</h4>
                <p className="text-[10px] text-gray-500">Relational mappings between identities, infrastructure, and flows are synchronized.</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-blue-400 hover:underline">VIEW FULL GRAPH</button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
