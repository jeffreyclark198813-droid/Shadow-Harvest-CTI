import React, { useState } from 'react';
import { Target, IntelligenceReport, ThreatAssessment } from '../services/dbService';
import { Globe, Eye, Server, Key, ShieldAlert, Cpu, Loader2, UserCheck, Terminal } from 'lucide-react';
import { runDarkWebScan } from '../services/geminiService';

interface DarkWebScannerViewProps {
  target: Target;
  onScanComplete?: (reports: IntelligenceReport[], assessments: ThreatAssessment[]) => void;
}

export const DarkWebScannerView: React.FC<DarkWebScannerViewProps> = ({ target, onScanComplete }) => {
  const [onionUrl, setOnionUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    vendorProfiles: string[];
    pgpKeys: string[];
    misconfigurations: string[];
    rawOutput: string;
  } | null>(null);

  const handleScan = async () => {
    if (!onionUrl) return;
    setIsScanning(true);
    setScanResults(null);

    try {
      const results = await runDarkWebScan(target.id || '', onionUrl);
      
      // Parse structured data if possible, fallback to raw
      let parsed;
      try {
        const jsonMatch = results.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
           parsed = JSON.parse(jsonMatch[1]);
        } else {
           parsed = JSON.parse(results);
        }
        
        setScanResults({
          vendorProfiles: parsed.vendorProfiles || [],
          pgpKeys: parsed.pgpKeys || [],
          misconfigurations: parsed.misconfigurations || [],
          rawOutput: results
        });
      } catch (e) {
        setScanResults({
          vendorProfiles: [],
          pgpKeys: [],
          misconfigurations: [],
          rawOutput: results
        });
      }

      // Notify parent to refresh reports if needed
      if (onScanComplete) {
         // This is a simplification; ideally the geminiService saves the reports and we just refetch
         // For now, assume geminiService added a report.
         onScanComplete([], []); 
      }
    } catch (error) {
      console.error("Dark web scan failed", error);
      setScanResults({
         vendorProfiles: [],
         pgpKeys: [],
         misconfigurations: ['Scan failed. See console.'],
         rawOutput: String(error)
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2 mb-4">
        <Globe className="text-harvest-accent" size={20} />
        <h2 className="text-lg font-bold text-white tracking-widest uppercase">Dark Web Intelligence</h2>
      </div>

      <div className="hardware-surface p-6 border border-harvest-border bg-black/40">
         <div className="flex gap-4 items-end mb-8">
            <div className="flex-1 space-y-2">
              <label className="mono-label !text-gray-400">Target Onion Service / Forum URL</label>
              <div className="flex items-center bg-black border border-harvest-border focus-within:border-harvest-accent transition-colors">
                <div className="pl-3 text-gray-500 font-mono">http://</div>
                <input 
                  type="text"
                  placeholder="xxxxxxxxxxxx.onion"
                  value={onionUrl}
                  onChange={e => setOnionUrl(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-sm p-3 outline-none"
                />
              </div>
            </div>
            <button
               onClick={handleScan}
               disabled={!onionUrl || isScanning}
               className="hardware-button !bg-harvest-accent !text-black hover:!bg-[#00ffcc] px-6 py-3 h-[46px] flex items-center gap-2"
            >
               {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
               <span className="font-bold uppercase tracking-widest text-xs">Initialize Scan</span>
            </button>
         </div>

         {isScanning && (
           <div className="p-12 text-center border border-harvest-border/50 bg-black/50 rounded flex flex-col items-center justify-center space-y-4">
             <div className="relative">
               <Globe size={48} className="text-gray-600 animate-pulse" />
               <div className="absolute inset-0 border-2 border-harvest-accent rounded-full animate-ping opacity-20" />
             </div>
             <div className="space-y-1">
               <h3 className="text-harvest-accent font-bold tracking-widest uppercase">Enumerating Onion Service</h3>
               <p className="text-xs text-gray-500 font-mono">Analyzing directories, extracting PGP material, identifying stack fingerprints...</p>
             </div>
           </div>
         )}

         {scanResults && !isScanning && (
           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <UserCheck size={12} className="text-[#0088ff]"/> Vendor Profiles
                   </h4>
                   <ul className="space-y-2">
                     {scanResults.vendorProfiles.length > 0 ? scanResults.vendorProfiles.map((p, i) => (
                       <li key={i} className="text-xs text-white font-mono break-all bg-black/30 p-2 border border-white/5">{p}</li>
                     )) : <li className="text-xs text-gray-500 italic">No patterns detected.</li>}
                   </ul>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Key size={12} className="text-[#ffff00]"/> PGP Key Material
                   </h4>
                   <ul className="space-y-2">
                     {scanResults.pgpKeys.length > 0 ? scanResults.pgpKeys.map((k, i) => (
                       <li key={i} className="text-[10px] text-white font-mono break-all bg-black/30 p-2 border border-white/5 line-clamp-3">{k}</li>
                     )) : <li className="text-xs text-gray-500 italic">No keys extracted.</li>}
                   </ul>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-10">
                     <ShieldAlert size={64} className="text-harvest-warning" />
                   </div>
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                     <Server size={12} className="text-harvest-warning"/> Stack Misconfigurations
                   </h4>
                   <ul className="space-y-2 relative z-10">
                     {scanResults.misconfigurations.length > 0 ? scanResults.misconfigurations.map((m, i) => (
                       <li key={i} className="text-xs text-harvest-warning font-mono bg-black/30 p-2 border border-harvest-warning/20">{m}</li>
                     )) : <li className="text-xs text-gray-500 italic">No overt misconfigurations detected.</li>}
                   </ul>
                </div>
              </div>

              <div className="mt-6 border border-white/10 bg-black p-4 rounded">
                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Terminal size={12}/> Raw Output Log
                 </h4>
                 <pre className="text-[9px] text-gray-500 font-mono whitespace-pre-wrap overflow-y-auto max-h-60 custom-scrollbar p-2 bg-black/50">
                    {scanResults.rawOutput}
                 </pre>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
