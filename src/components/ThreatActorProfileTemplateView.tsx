import React, { useState } from 'react';
import { Target } from '../services/dbService';
import { generateThreatActorProfile } from '../services/geminiService';
import { FileText, ShieldAlert, Cpu, Activity, User, RefreshCw, Target as TargetIcon, BrainCircuit } from 'lucide-react';
import { notify } from './Toaster';
import { useEnduringState } from '../hooks/useEnduringState';

interface ThreatActorProfileTemplateViewProps {
  target: Target;
  intelligenceContext: string;
}

export const ThreatActorProfileTemplateView: React.FC<ThreatActorProfileTemplateViewProps> = ({ target, intelligenceContext }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useEnduringState<any | null>(`${target.id}_threat_profile`, null);

  const runProfileGeneration = async () => {
    setLoading(true);
    try {
      const data = await generateThreatActorProfile(intelligenceContext, undefined);
      setProfile(data.actorProfile);
      notify({ title: 'Profile Generated', message: 'Threat Actor Profile successfully generated.', type: 'success' });
    } catch (err: any) {
      notify({ title: 'Generation Failed', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="mono-label text-white uppercase tracking-widest flex items-center gap-2">
          <BrainCircuit size={14} className="text-red-500" />
          AI-Generated Threat Actor Profile
        </h3>
        <button
          onClick={runProfileGeneration}
          disabled={loading}
          className="hardware-button-primary px-4 py-2 flex items-center gap-2 text-[10px]"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
          {loading ? 'GENERATING...' : 'GENERATE PROFILE'}
        </button>
      </div>

      {!profile && !loading && (
        <div className="hardware-surface p-12 text-center border border-dashed border-white/10">
          <BrainCircuit size={32} className="mx-auto text-gray-500 mb-4 opacity-50" />
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
            Awaiting AI profiling.
          </p>
        </div>
      )}

      {profile && (
        <div className="hardware-surface p-6 space-y-8 mb-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="text-red-500" /> Threat Actor Analysis
              </h2>
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold border ${profile.attribution.confidenceScore > 0.8 ? 'bg-red-500/10 text-red-500 border-red-500/30' : profile.attribution.confidenceScore > 0.5 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
              CONFIDENCE: {(profile.attribution.confidenceScore * 100).toFixed(0)}%
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2 flex items-center gap-2"><Activity size={12} /> Attribution Reasoning</h4>
            <p className="text-[11px] text-gray-300 font-mono leading-relaxed bg-black/30 p-4 border border-white/5 rounded">
              {profile.attribution.reasoning}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><Cpu size={12}/> Infrastructure Patterns</h4>
                 <ul className="list-disc pl-4 text-[10px] text-gray-400 font-mono space-y-1">
                   {profile.infrastructurePatterns?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                 </ul>
              </div>
              
              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><User size={12}/> Identifier Clusters</h4>
                 <ul className="list-disc pl-4 text-[10px] text-gray-400 font-mono space-y-1">
                   {profile.identifierClusters?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                 </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><ShieldAlert size={12}/> Methodology Correlation</h4>
                 <div className="bg-black/40 border border-white/5 p-2 rounded">
                    <span className="text-[9px] text-[#00ffcc] font-bold uppercase">{profile.methodologyCorrelation.techniqueName} </span>
                    <span className="text-[9px] text-gray-400">| ID: {profile.methodologyCorrelation.techniqueId}</span>
                    <p className="text-[10px] text-gray-300 font-mono mt-1">{profile.methodologyCorrelation.description}</p>
                 </div>
              </div>

              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><TargetIcon size={12}/> Predictions</h4>
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400">Future Targets:</p>
                    <ul className="list-disc pl-4 text-[10px] text-gray-400 font-mono">
                      {profile.predictions.likelyFutureTargets?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                    </ul>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">Predicted Behaviors:</p>
                    <ul className="list-disc pl-4 text-[10px] text-gray-400 font-mono">
                      {profile.predictions.predictedBehaviors?.map((b: string, i: number) => <li key={i}>{b}</li>)}
                    </ul>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
