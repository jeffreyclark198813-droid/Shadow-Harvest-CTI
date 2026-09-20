import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { EntropyPoint } from '../types/intelligence_ops';
import { getEntropyHeatmapData } from '../services/dbService';
import { AlertCircle, Zap, ShieldAlert } from 'lucide-react';

export const GlobalEntropyHeatmap: React.FC = () => {
  const [points, setPoints] = useState<EntropyPoint[]>([]);
  const [hoveredNode, setHoveredNode] = useState<EntropyPoint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getEntropyHeatmapData().then(setPoints);
  }, []);

  return (
    <div className="hardware-surface p-6 overflow-hidden relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-tighter flex items-center gap-2">
            <Zap size={14} className="text-harvest-accent animate-pulse" />
            Global Entropy Heatmap
          </h3>
          <p className="mono-label !text-[8px]">Real-time High-Entropy Detection (T0 Sources)</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-bold text-red-500">CRITICAL HOTSPOTS</span>
          </div>
        </div>
      </div>

      <div className="relative aspect-[21/9] bg-black/40 border border-harvest-border rounded-xl overflow-hidden cursor-crosshair">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #00ff00 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        {/* Heatmap Blobs (simplified with CSS gradients) */}
        {points.map((point) => (
          <motion.div
            key={point.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${point.value * 120}px`,
              height: `${point.value * 120}px`,
              background: `radial-gradient(circle, ${point.value > 0.8 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 255, 0, 0.2)'} 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(10px)',
            }}
          />
        ))}

        {/* Interactive Nodes */}
        {points.map((point) => (
          <motion.div
            key={`node-${point.id}`}
            className="absolute w-2 h-2 rounded-full bg-white border border-black z-10 cursor-pointer"
            style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -50%)' }}
            whileHover={{ scale: 2, backgroundColor: '#00ff00' }}
            onHoverStart={() => setHoveredNode(point)}
            onHoverEnd={() => setHoveredNode(null)}
          >
            {point.value > 0.85 && (
              <div className="absolute -inset-2 border border-red-500 rounded-full animate-ping opacity-50" />
            )}
          </motion.div>
        ))}

        {/* Floating Tooltip */}
        {hoveredNode && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 bg-black/90 border border-harvest-accent/30 p-3 rounded-lg backdrop-blur-md z-20 w-48 shadow-2xl"
          >
            <p className="text-[10px] font-bold text-harvest-accent uppercase">{hoveredNode.label}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-gray-500">ENTROPY LEVEL</span>
              <span className={`text-[10px] font-mono ${(hoveredNode.value * 100) > 80 ? 'text-red-500' : 'text-harvest-accent'}`}>
                {(hoveredNode.value * 100).toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${hoveredNode.value * 100}%` }}
                className={`h-full ${hoveredNode.value > 0.8 ? 'bg-red-500' : 'bg-harvest-accent'}`} 
              />
            </div>
            <p className="text-[8px] text-gray-600 mt-2 italic">IMMEDIATE INVESTIGATION REQUIRED</p>
          </motion.div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {[
          { label: 'Active Hotspots', value: points.filter(p => p.value > 0.7).length, icon: ShieldAlert, color: 'text-red-500' },
          { label: 'Avg Entropy', value: `${(points.reduce((acc, p) => acc + p.value, 0) / points.length * 100).toFixed(1)}%`, icon: AlertCircle, color: 'text-yellow-500' },
          { label: 'T0 Sensors', value: points.length, icon: Zap, color: 'text-harvest-accent' },
        ].map((stat, i) => (
          <div key={i} className="bg-black/20 rounded-lg p-2 border border-white/5 flex items-center gap-3">
            <stat.icon size={14} className={stat.color} />
            <div>
              <p className="text-[8px] text-gray-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xs font-bold text-white font-mono">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
