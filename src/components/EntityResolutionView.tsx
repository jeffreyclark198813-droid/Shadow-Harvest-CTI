import React, { useState } from 'react';
import { Node } from './Graph';
import { GitMerge, GitPullRequest, Search, Check, X, ShieldAlert, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EntityResolutionViewProps {
  nodes: Node[];
  onMergeEntities: (sourceNodeId: string, targetNodeId: string, reason: string) => void;
  loading: boolean;
}

export const EntityResolutionView: React.FC<EntityResolutionViewProps> = ({ nodes, onMergeEntities, loading }) => {
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [search, setSearch] = useState('');

  const filteredNodes = nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()) || n.type.toLowerCase().includes(search.toLowerCase()));

  const handleMerge = () => {
    if (sourceId && targetId && reason) {
      onMergeEntities(sourceId, targetId, reason);
      setSourceId('');
      setTargetId('');
      setReason('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="mono-label flex items-center gap-2">
          <GitMerge size={14} className="text-[#00ffcc]" />
          Entity Resolution Module
        </h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Merge overlapping identities & infrastructure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Node Selection Panel */}
        <div className="hardware-surface p-4 flex flex-col h-[600px]">
          <div className="mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search nodes to resolve..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#111] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-harvest-accent transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredNodes.map(node => (
              <div key={node.id} className="flex items-center justify-between p-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded transition-colors group">
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-white uppercase tracking-tighter truncate">{node.label}</p>
                  <p className="text-[9px] text-gray-500 uppercase">{node.type}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => setSourceId(node.id)}
                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded border transition-colors ${sourceId === node.id ? 'bg-[#ff00ff]/20 border-[#ff00ff] text-[#ff00ff]' : 'border-[#333] hover:border-[#ff00ff] text-gray-400'}`}
                  >
                    Select Source
                  </button>
                  <button 
                    onClick={() => setTargetId(node.id)}
                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded border transition-colors ${targetId === node.id ? 'bg-[#00ffcc]/20 border-[#00ffcc] text-[#00ffcc]' : 'border-[#333] hover:border-[#00ffcc] text-gray-400'}`}
                  >
                    Select Target
                  </button>
                </div>
              </div>
            ))}
            {filteredNodes.length === 0 && (
              <div className="text-center text-gray-600 text-[10px] uppercase py-8 italic">No matching entities found in intelligence graph.</div>
            )}
          </div>
        </div>

        {/* Resolution Control Panel */}
        <div className="space-y-6 flex flex-col h-[600px]">
          <div className="hardware-surface p-6 flex-1 flex flex-col">
            <h4 className="mono-label mb-6 text-white border-b border-white/10 pb-2">Merge Configuration</h4>
            
            <div className="flex-1 flex flex-col justify-center space-y-8">
              
              {/* Source Node */}
              <div className="relative border-l-2 border-[#ff00ff] pl-4">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest absolute -top-3 bg-harvest-bg px-1 text-[#ff00ff]">Source Entity (Absorbed)</p>
                {sourceId ? (
                  <div className="bg-[#111] border border-[#333] p-4 rounded mt-2 flex justify-between items-center">
                     <div>
                       <p className="text-sm font-bold text-white">{nodes.find(n => n.id === sourceId)?.label}</p>
                       <p className="text-[10px] text-gray-500">{nodes.find(n => n.id === sourceId)?.type}</p>
                     </div>
                     <button onClick={() => setSourceId('')} className="p-1 hover:bg-[#222] rounded text-gray-400 hover:text-white"><X size={14}/></button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#333] p-4 rounded mt-2 text-center text-gray-600 text-[10px] uppercase">
                    Select a source entity
                  </div>
                )}
              </div>

              <div className="flex justify-center -my-4 relative z-10">
                <div className="bg-harvest-bg p-2 rounded-full border border-[#333]">
                  <GitPullRequest size={20} className="text-gray-400" />
                </div>
              </div>

              {/* Target Node */}
              <div className="relative border-l-2 border-[#00ffcc] pl-4">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest absolute -top-3 bg-harvest-bg px-1 text-[#00ffcc]">Target Entity (Primary)</p>
                {targetId ? (
                  <div className="bg-[#111] border border-[#333] p-4 rounded mt-2 flex justify-between items-center">
                     <div>
                       <p className="text-sm font-bold text-white">{nodes.find(n => n.id === targetId)?.label}</p>
                       <p className="text-[10px] text-gray-500">{nodes.find(n => n.id === targetId)?.type}</p>
                     </div>
                     <button onClick={() => setTargetId('')} className="p-1 hover:bg-[#222] rounded text-gray-400 hover:text-white"><X size={14}/></button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#333] p-4 rounded mt-2 text-center text-gray-600 text-[10px] uppercase">
                    Select a target entity
                  </div>
                )}
              </div>

              {/* Resolution Reason */}
              <div className="mt-8 space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resolution Justification</label>
                 <textarea 
                   value={reason}
                   onChange={e => setReason(e.target.value)}
                   className="w-full bg-[#111] border border-[#333] rounded p-3 text-xs text-white focus:outline-none focus:border-harvest-accent transition-colors font-mono resize-none h-24"
                   placeholder="E.g., Overlapping IP ranges and shared PGP key signature in recent commits..."
                 />
              </div>
            </div>

            <button 
              onClick={handleMerge}
              disabled={loading || !sourceId || !targetId || !reason || sourceId === targetId}
              className={`w-full py-4 mt-6 rounded font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                (!sourceId || !targetId || !reason || sourceId === targetId)
                  ? 'bg-[#111] text-gray-600 border border-[#333] cursor-not-allowed'
                  : 'bg-harvest-accent text-black hover:bg-white hover:text-black shadow-[0_0_20px_rgba(0,255,204,0.3)]'
              }`}
            >
              {loading ? <Cpu size={14} className="animate-pulse" /> : <ShieldAlert size={14} />}
              {loading ? 'Resolving Hierarchy...' : 'Execute Resolution'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
