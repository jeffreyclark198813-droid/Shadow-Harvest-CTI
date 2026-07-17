import React, { useMemo } from 'react';
import { Target } from '../services/dbService';
import { Network, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface CorrelationHeatmapProps {
  targets: Target[];
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ targets }) => {
  const heatmapData = useMemo(() => {
    // We create a pseudo-heatmap by looking at target intelligence metrics
    // For a real app, this would use a robust graph analysis backend
    
    // Sort targets by activity (most reports/events)
    const activeTargets = [...targets].sort((a, b) => {
       const aScore = (a.reports?.length || 0) + (a.threatAssessments?.length || 0);
       const bScore = (b.reports?.length || 0) + (b.threatAssessments?.length || 0);
       return bScore - aScore;
    }).slice(0, 5); // Top 5 targets

    if (activeTargets.length < 2) return null;

    const data = [];
    for (let i = 0; i < activeTargets.length; i++) {
      const row = [];
      for (let j = 0; j < activeTargets.length; j++) {
        if (i === j) {
           row.push({ source: activeTargets[i].name, target: activeTargets[j].name, weight: 1.0 });
        } else {
           // Simulate correlation weight based on shared types or just random for visual effect
           let weight = 0;
           if (activeTargets[i].type === activeTargets[j].type) weight += 0.3;
           if (activeTargets[i].isPriorityAsset && activeTargets[j].isPriorityAsset) weight += 0.4;
           // Introduce some controlled randomness for demonstration
           weight += (Math.sin(i * j) + 1) * 0.15;
           
           row.push({ 
             source: activeTargets[i].name, 
             target: activeTargets[j].name, 
             weight: Math.min(0.9, weight) 
           });
        }
      }
      data.push(row);
    }
    
    return { targets: activeTargets, matrix: data };
  }, [targets]);

  if (!heatmapData) {
     return (
       <div className="hardware-surface p-4 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
         <Network size={24} className="mb-2 opacity-50" />
         <p className="text-[10px] uppercase font-mono tracking-widest">Insufficient Data for Heatmap</p>
         <p className="text-[8px] mt-1">Require multiple active targets</p>
       </div>
     );
  }

  const getColor = (weight: number) => {
     if (weight >= 1.0) return 'bg-white/20 border-white/40'; // Self
     if (weight > 0.7) return 'bg-[#ff00ff]/60 border-[#ff00ff]/80 shadow-[0_0_10px_rgba(255,0,255,0.4)]'; // High correlation
     if (weight > 0.4) return 'bg-harvest-accent/40 border-harvest-accent/60'; // Med
     if (weight > 0.2) return 'bg-[#0088ff]/20 border-[#0088ff]/40'; // Low
     return 'bg-white/5 border-white/10'; // None
  };

  return (
    <div className="hardware-surface p-4 border border-harvest-border bg-black/40">
      <div className="flex items-center justify-between mb-4 border-b border-harvest-border pb-2">
         <h3 className="mono-label !text-harvest-accent flex items-center gap-2">
           <Activity size={12}/> Correlation Heatmap
         </h3>
         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live Engine</span>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[400px]">
          {/* Header Row */}
          <div className="flex mb-1">
             <div className="w-24 shrink-0"></div>
             {heatmapData.targets.map((t, i) => (
                <div key={i} className="flex-1 flex justify-center items-end pb-2">
                  <div className="text-[8px] font-mono text-gray-400 uppercase transform -rotate-45 origin-bottom-left truncate w-20">
                    {t.name}
                  </div>
                </div>
             ))}
          </div>
          
          {/* Matrix */}
          <div className="space-y-1">
            {heatmapData.matrix.map((row, i) => (
               <div key={i} className="flex items-center gap-1">
                 <div className="w-24 shrink-0 text-[9px] font-mono text-gray-400 uppercase truncate text-right pr-2">
                   {heatmapData.targets[i].name}
                 </div>
                 {row.map((cell, j) => (
                   <motion.div 
                     key={`${i}-${j}`}
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ delay: (i * 0.1) + (j * 0.1) }}
                     className={`flex-1 aspect-square rounded-sm border ${getColor(cell.weight)} transition-all relative group flex items-center justify-center`}
                   >
                      <div className="opacity-0 group-hover:opacity-100 absolute z-10 bg-black border border-white/20 p-2 rounded text-[9px] whitespace-nowrap font-mono text-white pointer-events-none transform -translate-y-full top-0">
                         {cell.source} ↔ {cell.target}<br/>
                         Correlation: {(cell.weight * 100).toFixed(0)}%
                      </div>
                   </motion.div>
                 ))}
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

