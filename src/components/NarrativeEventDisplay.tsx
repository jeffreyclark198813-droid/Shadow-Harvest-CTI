import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Zap, Target, ChevronRight, Loader2 } from 'lucide-react';
import { NarrativeEvent, resolveNarrativeEvent } from '../services/dbService';

interface NarrativeEventDisplayProps {
  events: NarrativeEvent[];
  onResolve: (eventId: string) => void;
  loading?: boolean;
}

export const NarrativeEventDisplay: React.FC<NarrativeEventDisplayProps> = ({ events, onResolve, loading }) => {
  if (events.length === 0 && !loading) return null;

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`border-l-4 p-6 bg-[#111] border border-[#222] rounded-r-lg relative overflow-hidden ${
              event.type === 'threat' ? 'border-red-500' : 
              event.type === 'opportunity' ? 'border-[#00ff00]' : 'border-yellow-500'
            }`}
          >
            {/* Background Icon Watermark */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              {event.type === 'threat' ? <AlertTriangle size={120} /> : 
               event.type === 'opportunity' ? <Zap size={120} /> : <Target size={120} />}
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                  event.type === 'threat' ? 'bg-red-500/10 text-red-500' : 
                  event.type === 'opportunity' ? 'bg-[#00ff00]/10 text-[#00ff00]' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {event.type}
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-tighter">{event.title}</h3>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {event.description}
              </p>

              <div className="bg-black/40 p-3 border border-[#222] rounded mb-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Projected Impact</p>
                <p className="text-[11px] text-white italic">{event.impact}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => event.id && onResolve(event.id)}
                    className="group flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#00ff00] transition-all text-left"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-widest group-hover:text-[#00ff00] transition-colors">
                        {choice.label}
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase mt-1">
                        {choice.consequence}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-[#00ff00] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {loading && (
        <div className="flex items-center justify-center p-8 bg-[#111] border border-[#222] border-dashed rounded-lg">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Generating Narrative Event...</span>
          </div>
        </div>
      )}
    </div>
  );
};
