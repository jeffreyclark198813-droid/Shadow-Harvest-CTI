import React, { useState } from 'react';
import { Target } from '../services/dbService';
import { generateThreatActorProfile } from '../services/geminiService';
import { FileText, ShieldAlert, Cpu, Activity, User, Banknote, RefreshCw } from 'lucide-react';
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
      setProfile(data);
      notify({ title: 'Profile Generated', message: 'Threat Actor Template successfully populated.', type: 'success' });
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
          <FileText size={14} className="text-red-500" />
          Standardized Threat Actor Profile
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
          <FileText size={32} className="mx-auto text-gray-500 mb-4 opacity-50" />
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
            Awaiting profile generation.
          </p>
        </div>
      )}

      {profile && profile.actors && profile.actors.map((actor: any, idx: number) => (
        <div key={idx} className="hardware-surface p-6 space-y-8 mb-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="text-red-500" /> {actor.actorName}
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-1">Sophistication: {actor.technicalSophistication}</p>
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold border ${actor.attributionConfidence === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/30' : actor.attributionConfidence === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
              CONFIDENCE: {actor.attributionConfidence}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2 flex items-center gap-2"><Activity size={12} /> Executive Summary</h4>
            <p className="text-[11px] text-gray-300 font-mono leading-relaxed bg-black/30 p-4 border border-white/5 rounded">
              {actor.executiveSummary}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><Cpu size={12}/> Observed Infrastructure</h4>
                 <ul className="list-disc pl-4 text-[10px] text-gray-400 font-mono space-y-1">
                   {actor.observedInfrastructure?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                 </ul>
              </div>
              
              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><User size={12}/> Known Associates / Personas</h4>
                 <ul className="list-disc pl-4 text-[10px] text-gray-400 font-mono space-y-1">
                   {actor.associates?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                 </ul>
              </div>

              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><Banknote size={12}/> Financial Indicators</h4>
                 <ul className="list-disc pl-4 text-[10px] text-gray-400 font-mono space-y-1">
                   {actor.financialIndicators?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                 </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><ShieldAlert size={12}/> TTPs (Tactics, Techniques, Procedures)</h4>
                 <div className="space-y-2">
                   {actor.ttps?.map((ttp: any, i: number) => (
                     <div key={i} className="bg-black/40 border border-white/5 p-2 rounded">
                       <span className="text-[9px] text-[#00ffcc] font-bold uppercase">{ttp.tactic} </span>
                       <span className="text-[9px] text-gray-400">| {ttp.technique}</span>
                       <p className="text-[10px] text-gray-300 font-mono mt-1">{ttp.description}</p>
                     </div>
                   ))}
                 </div>
              </div>

              <div>
                 <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2"><Activity size={12}/> Historical Activity</h4>
                 <ul className="list-inside list-decimal text-[10px] text-gray-400 font-mono space-y-1">
                   {actor.historicalActivity?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                 </ul>
              </div>
            </div>
            
          </div>
        </div>
      ))}
    </div>
  );
};
