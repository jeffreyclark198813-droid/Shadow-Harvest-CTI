import React, { useState } from 'react';
import { Scale, Loader2, AlertTriangle, CheckCircle2, ShieldAlert, Shield, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { IntelligenceReport } from '../services/dbService';
import { evaluateEthicalRisk } from '../services/geminiService';
import { notify } from './Toaster';
import { auth } from '../firebase';
import { incrementUserStat, unlockAchievement } from '../services/dbService';
import { useEnduringState } from '../hooks/useEnduringState';

interface EthicalRiskAssessmentViewProps {
  targetId: string;
  targetName: string;
  reports: IntelligenceReport[];
}

interface RiskAssessment {
  complianceScore: number;
  riskLevel: string;
  summary: string;
  identifiedRisks: {
    category: string;
    description: string;
    severity: string;
    mitigation: string;
  }[];
  boundaries: string[];
  recommendation: string;
}

export const EthicalRiskAssessmentView: React.FC<EthicalRiskAssessmentViewProps> = ({ targetId, targetName, reports }) => {
  const [assessment, setAssessment] = useEnduringState<RiskAssessment | null>(`${targetId}_ethical_eval`, null);
  const [loading, setLoading] = useState(false);

  const runAssessment = async () => {
    if (reports.length === 0) {
      notify({ type: 'error', title: 'Insufficient Data', message: 'No intelligence gathered yet to assess.' });
      return;
    }

    setLoading(true);
    try {
      const context = reports.map(r => r.content).join('\n\n');
      // Pass the operational context to Gemini
      const result = await evaluateEthicalRisk(targetName, context);
      setAssessment(result);
      notify({ type: 'success', title: 'Assessment Complete', message: 'Phase 6 Ethical Risk Assessment generated.' });
      
      if (auth.currentUser) {
        incrementUserStat(auth.currentUser.uid, 'actionsTaken');
        unlockAchievement(auth.currentUser.uid, 'ethics_champion');
      }
    } catch (err: any) {
      console.error(err);
      notify({ type: 'error', title: 'Assessment Failed', message: err.message || 'An error occurred during assessment.' });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch(level.toLowerCase()) {
      case 'low': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Scale size={14} className="text-blue-500" />
          Phase 6 - Ethical Risk Assessment
        </h3>
        
        <button 
          onClick={runAssessment}
          disabled={loading || reports.length === 0}
          className="hardware-button px-4 py-2 flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <ShieldCheck size={14} className="text-blue-500" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Generate Assessment</span>
        </button>
      </div>

      {!assessment && !loading && (
        <div className="bg-[#111] border border-[#222] p-12 rounded text-center">
          <Scale size={48} className="mx-auto text-gray-800 mb-4" />
          <p className="text-sm text-gray-500 uppercase tracking-widest">Awaiting Ethical Compliance Request</p>
          <p className="text-[10px] text-gray-600 font-mono mt-2 max-w-md mx-auto">Evaluating intelligence collection methods against compliance policies, OPSEC constraints, and analytical boundaries.</p>
        </div>
      )}

      {loading && (
        <div className="bg-[#111] border border-[#222] p-12 rounded flex flex-col items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold animate-pulse">Computing Risk Trajectory & Compliance Confidence...</p>
        </div>
      )}

      {assessment && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-[#222] p-6 rounded relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <CheckCircle2 size={120} />
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Compliance Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${assessment.complianceScore >= 80 ? 'text-green-500' : assessment.complianceScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {assessment.complianceScore}
                </span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] p-6 rounded relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertTriangle size={120} />
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Risk Level</p>
              <span className={`text-2xl font-black uppercase tracking-widest ${getRiskColor(assessment.riskLevel)}`}>
                {assessment.riskLevel}
              </span>
            </div>

            <div className="bg-[#111] border border-[#222] p-6 rounded relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ShieldAlert size={120} />
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Recommendation</p>
              <span className={`text-xl font-bold uppercase tracking-widest ${assessment.recommendation.toLowerCase() === 'proceed' ? 'text-green-500' : assessment.recommendation.toLowerCase() === 'monitor' ? 'text-yellow-500' : 'text-red-500'}`}>
                {assessment.recommendation}
              </span>
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] p-6 rounded">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Executive Summary</h4>
            <p className="text-[12px] text-gray-300 font-mono leading-relaxed">{assessment.summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={12} /> Identified Ethical Risks
              </h4>
              <div className="space-y-4">
                {assessment.identifiedRisks.map((risk, idx) => (
                  <div key={idx} className="bg-black/40 border border-[#222] p-4 rounded space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">{risk.category}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${getRiskColor(risk.severity)} bg-white/5`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono">{risk.description}</p>
                    <div className="mt-2 pt-2 border-t border-[#222]">
                      <span className="text-[9px] text-blue-400 uppercase font-bold">Mitigation: </span>
                      <span className="text-[10px] text-gray-300 font-mono">{risk.mitigation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} /> Established Boundaries
              </h4>
              <div className="bg-[#1a1a1a] border border-[#333] p-5 rounded space-y-3">
                {assessment.boundaries.map((boundary, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] text-gray-300 font-mono leading-relaxed">{boundary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
