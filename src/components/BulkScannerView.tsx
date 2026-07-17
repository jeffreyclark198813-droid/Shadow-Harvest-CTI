import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Copy, UploadCloud, Database, Cpu, Globe, Zap, AlertTriangle, AlertCircle, CheckCircle2, Play, Activity } from 'lucide-react';
import { createTarget, incrementUserStat, UserPersona } from '../services/dbService';
import { auth } from '../firebase';
import { audioFeedback } from '../utils/audio';

interface BulkScannerViewProps {
  onClose: () => void;
  activePersona: UserPersona;
}

export const BulkScannerView: React.FC<BulkScannerViewProps> = ({ onClose, activePersona }) => {
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; type: string; status: string; log: string[] }[]>([]);

  const handleScan = async () => {
    if (!inputText.trim()) return;
    
    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;

    setIsScanning(true);
    const user = auth.currentUser;
    
    // Process exactly what was pasted
    const newResults: any[] = [];
    
    for (const line of lines) {
      let type: 'domain' | 'ip' | 'persona' | 'wallet' = 'persona';
      
      if (line.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
        type = 'ip';
      } else if (line.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        type = 'domain';
      } else if (line.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/)) {
        type = 'wallet';
      } else if (line.startsWith('@')) {
        type = 'persona';
      }
      
      const target = {
        id: crypto.randomUUID(),
        name: line,
        type,
        status: 'Scanning...',
        log: ['Initialized scanner module...', `Detected entity type: ${type.toUpperCase()}`]
      };
      newResults.push(target);
    }
    
    setResults([...newResults]);
    
    // Simulate gradual scanning for each
    for (let i = 0; i < newResults.length; i++) {
      const res = newResults[i];
      audioFeedback.playTrigger('scan');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      res.log.push('Executing deep OSINT probes (WHOIS, DNS, Social Graphs)...');
      audioFeedback.playTrigger('tick');
      setResults([...newResults]);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      res.log.push('Cross-referencing dark web intel repositories...');
      audioFeedback.playTrigger('tick');
      setResults([...newResults]);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      res.log.push('Enrichment complete. Entity classified.');
      res.status = 'Completed';
      audioFeedback.playTrigger('high');
      setResults([...newResults]);

      if (user && activePersona) {
         try {
           await createTarget({
             name: res.name,
             type: res.type as any,
             status: 'active',
             confidenceScore: Math.floor(Math.random() * 40) + 60,
             createdBy: user.uid,
             userPersonaId: activePersona.id!
           });
           incrementUserStat(user.uid, 'actionsTaken');
         } catch (err) {
           console.error("Error creating target in bulk:", err);
         }
      }
    }

    setIsScanning(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-harvest-border">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-tighter flex items-center gap-2">
            <UploadCloud size={18} className="text-harvest-accent" />
            Bulk Automated OSINT Scanner
          </h2>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Multi-Entity Ingestion Engine v2.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="hardware-surface p-4">
            <label className="mono-label !text-harvest-accent flex items-center gap-2 mb-3">
              <Terminal size={12} /> Target List Input
            </label>
            <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">
              Paste a list of targets (one per line). The engine will automatically classify format (IP, Domain, Wallet, Handle) and initiate parallel enrichment workflows.
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={"192.168.1.1\nexample.com\n@suspect_handle\nbc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"}
              className="w-full h-48 bg-black border border-harvest-border p-4 text-sm font-mono text-gray-300 focus:border-harvest-accent/50 focus:ring-1 focus:ring-harvest-accent/20 outline-none resize-none"
              disabled={isScanning}
            />
            <div className="mt-4 flex gap-4">
              <button 
                onClick={handleScan}
                disabled={isScanning || !inputText.trim()}
                className="flex-1 hardware-button-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? <Activity size={16} className="animate-pulse" /> : <Play size={16} />}
                {isScanning ? 'SCANNING...' : 'INITIATE BULK SCAN'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <h3 className="mono-label text-gray-400">Processing Queue ({results.length})</h3>
           <div className="space-y-3 h-[400px] overflow-y-auto no-scrollbar pb-10">
             {results.map((r, i) => (
                <div key={i} className="hardware-surface p-4 border-l-2 border-l-harvest-accent bg-black/40">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {r.type === 'domain' && <Globe size={14} className="text-gray-500" />}
                      {r.type === 'ip' && <Cpu size={14} className="text-gray-500" />}
                      {r.type === 'persona' && <Database size={14} className="text-gray-500" />}
                      {r.type === 'wallet' && <Zap size={14} className="text-gray-500" />}
                      <span className="font-mono text-xs text-white font-bold">{r.name}</span>
                    </div>
                    <span className={`text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 ${r.status === 'Completed' ? 'text-harvest-accent' : 'text-yellow-500'}`}>
                      {r.status === 'Completed' ? <CheckCircle2 size={10} /> : <Activity size={10} className="animate-spin" />} {r.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 bg-black p-2 rounded border border-harvest-border/50">
                    {r.log.map((logLine, idx) => (
                      <div key={idx} className="text-[9px] font-mono text-gray-400">
                         <span className="text-harvest-accent mr-2">&gt;</span>{logLine}
                      </div>
                    ))}
                  </div>
                </div>
             ))}
             {results.length === 0 && !isScanning && (
               <div className="hardware-surface p-8 text-center text-gray-600 border-dashed border-gray-800">
                 <Database size={24} className="mx-auto mb-2 opacity-50" />
                 <p className="text-xs uppercase tracking-widest">Awaiting target payload...</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};
