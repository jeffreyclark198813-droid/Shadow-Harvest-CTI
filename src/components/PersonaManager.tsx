import React, { useState } from 'react';
import { AIPersona, addAIPersona, deleteAIPersona } from '../services/dbService';
import { User, Plus, Trash2, Shield, Brain, MessageSquare, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PersonaManagerProps {
  userId: string;
  personas: AIPersona[];
  selectedPersonaId: string | null;
  onSelect: (personaId: string | null) => void;
}

export const PersonaManager: React.FC<PersonaManagerProps> = ({ userId, personas, selectedPersonaId, onSelect }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPersona, setNewPersona] = useState<Partial<AIPersona>>({
    name: '',
    personality: '',
    knowledgeDomains: [],
    tone: 'Professional',
    isDefault: false
  });
  const [domainInput, setDomainInput] = useState('');

  const handleSave = async () => {
    if (!newPersona.name || !newPersona.personality || !newPersona.tone) return;
    
    await addAIPersona({
      userId,
      name: newPersona.name,
      personality: newPersona.personality,
      knowledgeDomains: newPersona.knowledgeDomains || [],
      tone: newPersona.tone,
      isDefault: newPersona.isDefault || false
    } as any);
    
    setIsAdding(false);
    setNewPersona({
      name: '',
      personality: '',
      knowledgeDomains: [],
      tone: 'Professional',
      isDefault: false
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this persona?')) {
      await deleteAIPersona(userId, id);
      if (selectedPersonaId === id) onSelect(null);
    }
  };

  const addDomain = () => {
    if (domainInput && !newPersona.knowledgeDomains?.includes(domainInput)) {
      setNewPersona({
        ...newPersona,
        knowledgeDomains: [...(newPersona.knowledgeDomains || []), domainInput]
      });
      setDomainInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Brain size={14} className="text-purple-500" />
          AI Persona Management
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> NEW PERSONA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Default Persona */}
        <div 
          onClick={() => onSelect(null)}
          className={`p-4 rounded border cursor-pointer transition-all ${
            !selectedPersonaId ? 'bg-purple-500/10 border-purple-500' : 'bg-[#111] border-[#222] hover:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
              <Shield size={20} className="text-gray-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase">Standard Analyst</h4>
              <p className="text-[10px] text-gray-500 uppercase">Default System Persona</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 line-clamp-2 italic">
            A world-class Cyber Threat Intelligence (CTI) analyst following standard operating procedures.
          </p>
        </div>

        {/* Custom Personas */}
        {personas.map((persona) => (
          <div 
            key={persona.id}
            onClick={() => onSelect(persona.id!)}
            className={`p-4 rounded border cursor-pointer transition-all relative group ${
              selectedPersonaId === persona.id ? 'bg-purple-500/10 border-purple-500' : 'bg-[#111] border-[#222] hover:border-gray-600'
            }`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(persona.id!); }}
              className="absolute top-2 right-2 p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-900/30 rounded flex items-center justify-center border border-purple-500/30">
                <User size={20} className="text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">{persona.name}</h4>
                <p className="text-[10px] text-purple-400 uppercase">{persona.tone}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 line-clamp-2 italic mb-2">
              {persona.personality}
            </p>
            <div className="flex flex-wrap gap-1">
              {persona.knowledgeDomains.slice(0, 3).map((d, i) => (
                <span key={i} className="text-[8px] bg-black/50 px-1.5 py-0.5 rounded text-gray-500 uppercase">{d}</span>
              ))}
              {persona.knowledgeDomains.length > 3 && (
                <span className="text-[8px] text-gray-600">+{persona.knowledgeDomains.length - 3}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Persona Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-[#222] w-full max-w-lg rounded-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-[#111] border-b border-[#222] flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Plus size={14} className="text-purple-500" />
                  Define Custom AI Persona
                </h4>
                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Persona Name</label>
                  <input
                    type="text"
                    value={newPersona.name}
                    onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                    placeholder="e.g. The Cryptographer"
                    className="w-full bg-black border border-[#222] rounded px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Personality Description</label>
                  <textarea
                    value={newPersona.personality}
                    onChange={(e) => setNewPersona({ ...newPersona, personality: e.target.value })}
                    placeholder="Describe how this persona thinks and acts..."
                    className="w-full bg-black border border-[#222] rounded px-3 py-2 text-xs text-white focus:border-purple-500 outline-none h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tone of Voice</label>
                    <select
                      value={newPersona.tone}
                      onChange={(e) => setNewPersona({ ...newPersona, tone: e.target.value })}
                      className="w-full bg-black border border-[#222] rounded px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    >
                      <option>Professional</option>
                      <option>Aggressive</option>
                      <option>Skeptical</option>
                      <option>Supportive</option>
                      <option>Cryptic</option>
                      <option>Academic</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Knowledge Domains</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                        placeholder="Add domain..."
                        className="flex-1 bg-black border border-[#222] rounded px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                      <button 
                        onClick={addDomain}
                        className="bg-[#222] hover:bg-[#333] px-3 rounded text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {newPersona.knowledgeDomains?.map((d, i) => (
                    <span key={i} className="text-[10px] bg-purple-500/10 border border-purple-500/30 px-2 py-1 rounded text-purple-400 flex items-center gap-1">
                      {d}
                      <button onClick={() => setNewPersona({
                        ...newPersona,
                        knowledgeDomains: newPersona.knowledgeDomains?.filter((_, idx) => idx !== i)
                      })}>
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-[#111] border-t border-[#222] flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Save size={14} /> SAVE PERSONA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
