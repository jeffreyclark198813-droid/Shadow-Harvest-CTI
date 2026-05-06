import React, { useState } from 'react';
import { METHODOLOGY } from '../constants/methodology';
import { BookOpen, Search, ChevronRight, Info, Shield, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const IntelligenceLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number | null>(null);

  const filteredMethodology = METHODOLOGY.filter(m => 
    m.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sections.some(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="mono-label text-gray-400">Intelligence Reference Hub</h2>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input 
            type="text"
            placeholder="SEARCH METHODOLOGIES..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-harvest-card border border-harvest-border rounded-xl px-12 py-3 text-sm focus:border-harvest-accent/50 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredMethodology.map((m, idx) => (
          <motion.div
            key={idx}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTopicIdx(idx)}
            className="hardware-surface p-4 flex items-center justify-between cursor-pointer active:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-harvest-accent/5 flex items-center justify-center border border-harvest-accent/10">
                <BookOpen size={18} className="text-harvest-accent" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-tighter">{m.topic}</h3>
                <p className="mono-label !text-[8px] mt-0.5">{m.sections.length} Techniques Documented</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-700" />
          </motion.div>
        ))}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedTopicIdx !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] bg-harvest-bg flex flex-col p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedTopicIdx(null)}
                  className="p-2 -ml-2 text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
                <h2 className="text-lg font-bold text-white uppercase tracking-tighter">
                  {filteredMethodology[selectedTopicIdx].topic}
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-8">
              {filteredMethodology[selectedTopicIdx].sections.map((section, sIdx) => (
                <div key={sIdx} className="hardware-surface p-6 space-y-4 bg-gradient-to-br from-white/[0.02] to-transparent">
                  <div className="flex items-center justify-between border-b border-harvest-border pb-3">
                    <h4 className="text-xs font-bold text-harvest-accent uppercase tracking-widest">{section.title}</h4>
                    <div className="flex gap-2">
                      <Shield size={14} className="text-gray-700" />
                      <Zap size={14} className="text-gray-700" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="mono-label mb-2">Technique Definition</p>
                      <p className="text-sm text-gray-300 leading-relaxed font-light">{section.definition}</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="mono-label !text-harvest-accent mb-3 flex items-center gap-2">
                        <Info size={12} /> Key Instances
                      </p>
                      <ul className="space-y-2">
                        {section.instances.map((inst, i) => (
                          <li key={i} className="text-[11px] text-gray-400 leading-snug border-l-2 border-harvest-accent/30 pl-3">
                            {inst}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-harvest-border">
                      <p className="mono-label !text-harvest-info mb-1">Operational Relevance</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed uppercase">{section.relevance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
