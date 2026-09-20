import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Info, Layers, Share2, Activity, Scale, Shield } from 'lucide-react';
import { METHODOLOGY } from '../constants/methodology';
import { EpistemicConstitutionView } from './EpistemicConstitutionView';
import { motion } from 'motion/react';

export const Methodology: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'epistemic' | 'sop'>('epistemic');

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0a0a0a] text-gray-300 font-mono overflow-hidden">
      <header className="h-16 border-b border-[#222] flex items-center justify-between px-6 bg-[#0d0d0d] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-[#222] rounded transition-colors text-gray-500 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a1a1a] border border-[#333] rounded">
              <Scale size={18} className="text-[#00ff00]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tighter uppercase">Intelligence Methodology & Constitution</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Evidence-Controlled Scientific Engineering Reconstruction</p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#111] p-1 rounded-lg border border-[#222]">
          <button
            onClick={() => setActiveTab('epistemic')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs uppercase font-bold transition-all ${
              activeTab === 'epistemic'
                ? 'bg-[#00ff00] text-black shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Shield size={12} />
            <span>Epistemic Constitution</span>
          </button>
          <button
            onClick={() => setActiveTab('sop')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs uppercase font-bold transition-all ${
              activeTab === 'sop'
                ? 'bg-[#00ff00] text-black shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <BookOpen size={12} />
            <span>Operational SOPs</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 custom-scrollbar">
        {activeTab === 'epistemic' ? (
          <div className="max-w-6xl mx-auto">
            <EpistemicConstitutionView />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-12">
            {METHODOLOGY.map((topic, topicIdx) => (
              <motion.section 
                key={topicIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: topicIdx * 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 border-b border-[#222] pb-4">
                  <span className="text-2xl font-bold text-[#00ff00] opacity-50">0{topicIdx + 1}</span>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tighter">{topic.topic}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topic.sections.map((section, sectionIdx) => (
                    <div key={sectionIdx} className="bg-[#111] border border-[#222] p-6 rounded-lg flex flex-col gap-4 hover:border-[#333] transition-colors">
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-bold text-[#00ff00] uppercase tracking-widest leading-tight">{section.title}</h3>
                        <Info size={14} className="text-gray-600" />
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Definition</p>
                          <p className="text-xs leading-relaxed text-gray-400">{section.definition}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Key Characteristics</p>
                          <p className="text-xs leading-relaxed text-gray-400">{section.characteristics}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Representative Instances</p>
                          <ul className="space-y-2">
                            {section.instances.map((inst, i) => (
                              <li key={i} className="text-[10px] text-gray-500 italic border-l border-[#333] pl-2">
                                {inst}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-[#222]">
                          <p className="text-[10px] text-[#00ff00] uppercase tracking-widest font-bold">Operational Relevance</p>
                          <p className="text-[10px] text-gray-500 mt-1">{section.relevance}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

