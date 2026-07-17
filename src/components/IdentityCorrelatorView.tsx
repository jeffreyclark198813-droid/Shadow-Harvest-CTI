import React, { useState } from 'react';
import { Network, Plus, Trash, Zap, UserCheck, ShieldAlert, Cpu } from 'lucide-react';
import { Target } from '../services/dbService';
import { Identifier, CorrelationMatch, analyzeIdentifiers } from '../utils/identityCorrelator';

interface IdentityCorrelatorViewProps {
  target: Target;
}

export const IdentityCorrelatorView: React.FC<IdentityCorrelatorViewProps> = ({ target }) => {
  const [identifiers, setIdentifiers] = useState<Identifier[]>([]);
  const [newPlatform, setNewPlatform] = useState<Identifier['platform']>('Telegram');
  const [newValue, setNewValue] = useState('');
  const [newBio, setNewBio] = useState('');
  const [matches, setMatches] = useState<CorrelationMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAdd = () => {
    if (!newValue.trim()) return;
    setIdentifiers(prev => [...prev, { 
      platform: newPlatform, 
      value: newValue, 
      metadata: newBio ? { bio: newBio } : undefined 
    }]);
    setNewValue('');
    setNewBio('');
    setMatches([]); // Reset matches on new data
  };

  const handleRemove = (index: number) => {
    setIdentifiers(prev => prev.filter((_, i) => i !== index));
    setMatches([]);
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate network delay for effect
    setTimeout(() => {
      const results = analyzeIdentifiers(identifiers);
      setMatches(results);
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Network className="text-harvest-accent" size={20} />
        <h2 className="text-lg font-bold text-white tracking-widest uppercase">Identity Correlator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="hardware-surface p-4 border border-harvest-border bg-black/40">
          <h3 className="mono-label !text-harvest-accent mb-4 border-b border-harvest-border pb-2">Known Identifiers</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex gap-2">
              <select 
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as any)}
                className="bg-black/50 border border-harvest-border text-white text-[10px] uppercase p-2 focus:border-harvest-accent outline-none"
              >
                <option value="Telegram">Telegram</option>
                <option value="Signal">Signal</option>
                <option value="Matrix">Matrix</option>
                <option value="XMPP">XMPP</option>
                <option value="Email">Email</option>
                <option value="Other">Other</option>
              </select>
              <input 
                type="text"
                placeholder="Identifier (e.g. @username, +12345)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="flex-1 bg-black/50 border border-harvest-border text-white text-xs p-2 focus:border-harvest-accent outline-none font-mono"
              />
            </div>
            <input 
              type="text"
              placeholder="Metadata / Bio (Optional)"
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              className="w-full bg-black/50 border border-harvest-border text-white text-xs p-2 focus:border-harvest-accent outline-none font-mono"
            />
            <button 
              onClick={handleAdd}
              disabled={!newValue.trim()}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] uppercase font-bold py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> Add Identifier
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {identifiers.map((id, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-harvest-accent uppercase tracking-widest">{id.platform}</span>
                    <span className="text-xs text-white font-mono">{id.value}</span>
                  </div>
                  {id.metadata?.bio && (
                    <div className="text-[10px] text-gray-500 font-mono mt-1 italic">Bio: {id.metadata.bio}</div>
                  )}
                </div>
                <button onClick={() => handleRemove(idx)} className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash size={14} />
                </button>
              </div>
            ))}
            {identifiers.length === 0 && (
              <div className="text-center p-4 text-gray-500 text-[10px] font-mono uppercase tracking-widest italic">
                No identifiers registered
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="hardware-surface p-4 border border-harvest-border bg-black/40 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-harvest-border pb-2">
             <h3 className="mono-label !text-harvest-accent">Correlation Results</h3>
             <button 
                onClick={runAnalysis}
                disabled={identifiers.length < 2 || isAnalyzing}
                className="text-[10px] font-bold text-black bg-harvest-accent hover:bg-[#00ffcc] px-3 py-1 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400"
              >
                {isAnalyzing ? <Cpu size={12} className="animate-spin" /> : <Zap size={12} />}
                {isAnalyzing ? 'Processing...' : 'Run Correlation'}
             </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {!isAnalyzing && matches.length === 0 && (
               <div className="h-full flex items-center justify-center text-center text-gray-500 text-[10px] font-mono uppercase tracking-widest italic p-4">
                  {identifiers.length < 2 ? "Add at least 2 identifiers to run correlation" : "No correlations found"}
               </div>
            )}

            {matches.map((match, idx) => (
              <div key={idx} className="p-3 bg-white/5 border border-white/10 relative overflow-hidden group">
                 {/* Match probability indicator */}
                 <div 
                   className="absolute left-0 top-0 bottom-0 w-1 transition-all" 
                   style={{ 
                     backgroundColor: match.probability > 0.7 ? '#00ff00' : match.probability > 0.4 ? '#ffff00' : '#ff0000',
                     boxShadow: `0 0 10px ${match.probability > 0.7 ? '#00ff00' : match.probability > 0.4 ? '#ffff00' : '#ff0000'}`
                   }}
                 />
                 
                 <div className="flex justify-between items-start pl-2">
                   <div className="space-y-2 w-full">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">{match.identifier1.platform}</span>
                         <span className="text-xs text-white font-mono">{match.identifier1.value}</span>
                       </div>
                       <UserCheck size={14} className="text-harvest-accent opacity-50" />
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">{match.identifier2.platform}</span>
                         <span className="text-xs text-white font-mono">{match.identifier2.value}</span>
                       </div>
                       <span className="text-[10px] font-mono font-bold text-[#00ffcc] bg-[#00ffcc]/10 px-1 border border-[#00ffcc]/30">
                         {(match.probability * 100).toFixed(0)}% MATCH
                       </span>
                     </div>
                     <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-gray-500 flex items-center gap-2">
                       <ShieldAlert size={10} className="text-harvest-warning" />
                       {match.reason}
                     </div>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
