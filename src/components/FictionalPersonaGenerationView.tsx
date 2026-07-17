import React, { useState } from 'react';
import { Target } from '../services/dbService';
import { generateFictionalPersonas } from '../services/geminiService';
import { Users, EyeOff, Key, Terminal, RefreshCw } from 'lucide-react';
import { notify } from './Toaster';
import { useEnduringState } from '../hooks/useEnduringState';

interface FictionalPersonaGenerationViewProps {
  target: Target;
  intelligenceContext: string;
}

export const FictionalPersonaGenerationView: React.FC<FictionalPersonaGenerationViewProps> = ({ target, intelligenceContext }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useEnduringState<any | null>(`${target.id}_fic_personas`, null);

  const runGeneration = async () => {
    setLoading(true);
    try {
      const res = await generateFictionalPersonas(intelligenceContext, undefined);
      setData(res);
      notify({ title: 'Personas Generated', message: 'Fictional personas derived from intelligence.', type: 'success' });
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
          <Users size={14} className="text-[#00ffaa]" />
          Fictional Persona Generation
        </h3>
        <button
          onClick={runGeneration}
          disabled={loading}
          className="hardware-button-primary px-4 py-2 flex items-center gap-2 text-[10px]"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Users size={14} />}
          {loading ? 'GENERATING...' : 'GENERATE PERSONAS'}
        </button>
      </div>

      {!data && !loading && (
        <div className="hardware-surface p-12 text-center border border-dashed border-white/10">
          <Users size={32} className="mx-auto text-gray-500 mb-4 opacity-50" />
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
            Awaiting fictional persona generation.
          </p>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.personas?.map((persona: any, i: number) => (
            <div key={i} className="hardware-surface p-5 space-y-4 border-t-2 border-[#00ffaa]">
               <div className="flex justify-between items-center pb-2 border-b border-white/5">
                 <h4 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                   <EyeOff size={14} className="text-[#00ffaa]" /> {persona.name}
                 </h4>
               </div>
               
               <div className="space-y-3">
                 <div>
                   <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Backstory</span>
                   <p className="text-[10px] text-gray-300 font-mono italic mt-1 leading-relaxed">"{persona.backstory}"</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-1"><Key size={10}/> Motivations</span>
                     <ul className="text-[10px] text-gray-300 font-mono mt-1 space-y-1">
                       {persona.motivations?.map((m: string, idx: number) => <li key={idx}>• {m}</li>)}
                     </ul>
                   </div>
                   <div>
                     <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-1"><Terminal size={10}/> Comm. Style</span>
                     <p className="text-[10px] text-gray-300 font-mono mt-1">{persona.communicationStyle}</p>
                   </div>
                 </div>

                 <div>
                   <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Digital Footprint Indicators</span>
                   <ul className="text-[10px] text-gray-400 font-mono mt-1 space-y-1 list-disc pl-4 bg-black/30 p-2 rounded border border-white/5">
                     {persona.digitalFootprint?.map((f: string, idx: number) => <li key={idx}>{f}</li>)}
                   </ul>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
