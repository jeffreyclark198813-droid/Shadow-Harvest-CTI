import React, { useState } from 'react';
import { SynthesizedOutput, addSynthesizedOutput, AIPersona } from '../services/dbService';
import { synthesizeIntelligence } from '../services/geminiService';
import { FileText, Zap, Layout, Target, CheckCircle2, Loader2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useEnduringState } from '../hooks/useEnduringState';

interface IntelligenceSynthesizerProps {
  targetId: string;
  targetName: string;
  intelligenceContext: string;
  persona?: AIPersona;
  outputs: SynthesizedOutput[];
}

export const IntelligenceSynthesizer: React.FC<IntelligenceSynthesizerProps> = ({ 
  targetId, 
  targetName, 
  intelligenceContext, 
  persona,
  outputs 
}) => {
  const [format, setFormat] = useEnduringState<'summary' | 'report' | 'comparison'>(`${targetId}_synth_format`, 'summary');
  const [focusAreas, setFocusAreas] = useEnduringState<string[]>(`${targetId}_synth_focus`, []);
  const [focusInput, setFocusInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useEnduringState<string | null>(`${targetId}_synth_result`, null);
  const [title, setTitle] = useEnduringState<string>(`${targetId}_synth_title`, '');

  const handleSynthesize = async () => {
    if (!intelligenceContext) return;
    setLoading(true);
    try {
      const output = await synthesizeIntelligence(targetName, intelligenceContext, format, focusAreas, persona);
      setResult(output);
      const formatLabel = (format || 'Report');
      setTitle(`${targetName} ${formatLabel.charAt(0).toUpperCase() + formatLabel.slice(1)} - ${new Date().toLocaleDateString()}`);
    } catch (error) {
      console.error("Synthesis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !title) return;
    await addSynthesizedOutput({
      targetId,
      title,
      format,
      content: result,
      focusAreas,
    });
    setResult(null);
    setTitle('');
  };

  const addFocusArea = () => {
    if (focusInput && !focusAreas.includes(focusInput)) {
      setFocusAreas([...focusAreas, focusInput]);
      setFocusInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-yellow-500" />
          Intelligence Synthesis Engine
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#111] border border-[#222] p-4 rounded space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Output Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['summary', 'report', 'comparison'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-2 py-2 rounded border text-[10px] font-bold uppercase transition-all ${
                      format === f ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-black border-[#222] text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Focus Areas</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
                  placeholder="e.g. Infrastructure"
                  className="flex-1 bg-black border border-[#222] rounded px-3 py-1.5 text-xs text-white focus:border-yellow-500 outline-none"
                />
                <button onClick={addFocusArea} className="bg-[#222] hover:bg-[#333] px-3 rounded text-white">
                  <Zap size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {focusAreas.map((area, i) => (
                  <span key={i} className="text-[9px] bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded text-yellow-500 flex items-center gap-1">
                    {area}
                    <button onClick={() => setFocusAreas(focusAreas.filter((_, idx) => idx !== i))}>
                      <Zap size={8} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleSynthesize}
              disabled={loading || !intelligenceContext}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              GENERATE SYNTHESIS
            </button>
          </div>

          {/* Previous Outputs */}
          <div className="bg-[#111] border border-[#222] p-4 rounded">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={12} /> Archive
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
              {outputs.map((out) => (
                <div key={out.id} className="p-3 bg-black border border-[#222] rounded hover:border-yellow-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold text-yellow-500 uppercase">{out.format}</span>
                    <span className="text-[8px] text-gray-600">{out.timestamp?.toDate().toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-white font-bold truncate">{out.title}</p>
                </div>
              ))}
              {outputs.length === 0 && (
                <p className="text-[10px] text-gray-600 text-center py-4">No archived products</p>
              )}
            </div>
          </div>
        </div>

        {/* Result Area */}
        <div className="lg:col-span-2">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-[#222] rounded-lg overflow-hidden flex flex-col h-full min-h-[500px]"
            >
              <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#222] flex justify-between items-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white uppercase tracking-widest outline-none border-b border-transparent focus:border-yellow-500 w-2/3"
                />
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 transition-colors"
                >
                  <Save size={12} /> SAVE PRODUCT
                </button>
              </div>
              <div className="p-6 overflow-auto flex-1 prose prose-invert prose-xs max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#111] border border-[#222] border-dashed rounded-lg h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <Layout size={32} className="text-gray-700" />
              </div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Awaiting Synthesis</h4>
              <p className="text-xs text-gray-600 max-w-xs">
                Configure your format and focus areas, then trigger the engine to synthesize collected intelligence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
