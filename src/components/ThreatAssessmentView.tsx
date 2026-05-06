import React from 'react';
import { ThreatAssessment } from '../services/dbService';
import { Shield, Target, Zap, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface ThreatAssessmentViewProps {
  assessments: ThreatAssessment[];
  onGenerate: () => void;
  loading: boolean;
}

export const ThreatAssessmentView: React.FC<ThreatAssessmentViewProps> = ({ assessments, onGenerate, loading }) => {
  const latest = assessments[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Shield size={14} className="text-purple-500" />
          Threat Assessment Module
        </h3>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'ANALYZING...' : 'GENERATE ASSESSMENT'}
        </button>
      </div>

      {!latest && !loading && (
        <div className="bg-[#111] border border-[#222] p-8 rounded text-center">
          <Shield size={32} className="mx-auto text-gray-700 mb-4" />
          <p className="text-sm text-gray-500">No threat assessment generated for this target yet.</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[#111] border border-[#222] rounded animate-pulse" />
          ))}
        </div>
      )}

      {latest && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-[#111] border border-[#222] p-6 rounded space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase">
              <Zap size={14} />
              Capabilities & Sophistication
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {latest.capabilities}
            </p>
          </div>

          <div className="bg-[#111] border border-[#222] p-6 rounded space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase">
              <Activity size={14} />
              MITRE ATT&CK Mapping (TTPs)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latest.ttps.map((ttp, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-[#333] p-4 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-blue-300 block">{ttp.id}</span>
                      <span className="text-xs font-bold text-white uppercase">{ttp.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-gray-500 uppercase">Confidence</span>
                      <span className={`text-xs font-bold ${
                        ttp.confidence > 0.8 ? 'text-[#00ff00]' : ttp.confidence > 0.5 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {(ttp.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed italic">
                    {ttp.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] p-6 rounded space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase">
              <Activity size={14} />
              Operational Scope
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {latest.operationalScope}
            </p>
          </div>

          <div className="bg-[#111] border border-[#222] p-6 rounded space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase">
              <Target size={14} />
              Potential Targets
            </div>
            <ul className="space-y-2">
              {latest.potentialTargets.map((target, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {target}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
};
