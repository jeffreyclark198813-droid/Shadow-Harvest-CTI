import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ThumbsUp, AlertCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SupportAndFeedback: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'feedback'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<{sender: 'user' | 'agent', text: string}[]>([
    { sender: 'agent', text: 'OpSec Division Support Online. State your inquiry.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Feedback state
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: newMsg }]);
    setChatInput('');
    
    // Initialize automated response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'agent', 
        text: 'Encrypted inquiry received. An operative will review your request shortly. Maintain radioshilence.' 
      }]);
    }, 1500);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    
    // Transmit telemetry
    setTimeout(() => {
      setFeedbackSent(true);
      setTimeout(() => {
        setIsOpen(false);
        setFeedbackSent(false);
        setFeedbackText('');
      }, 3000);
    }, 800);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 bg-harvest-accent text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-40"
      >
        <MessageCircle size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 h-[450px] hardware-surface !bg-black/95 !p-0 z-50 flex flex-col shadow-2xl overflow-hidden shadow-harvest-accent/10 border border-harvest-accent/30"
          >
            {/* Header */}
            <div className="flex bg-harvest-bg border-b border-harvest-border p-3 justify-between items-center px-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'chat' ? 'text-harvest-accent' : 'text-gray-500'}`}
                >
                  Live Comms
                </button>
                <button 
                  onClick={() => setActiveTab('feedback')}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'feedback' ? 'text-harvest-accent' : 'text-gray-500'}`}
                >
                  Feedback
                </button>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat bg-opacity-10 opacity-90">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded text-[11px] font-mono leading-relaxed shadow-md ${
                        m.sender === 'user' 
                          ? 'bg-harvest-accent/20 border border-harvest-accent/50 text-white rounded-tr-none' 
                          : 'bg-black/80 border border-gray-800 text-gray-300 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendChat} className="p-3 border-t border-gray-800 bg-harvest-bg/80 flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Transmit message..."
                    className="flex-1 bg-black/50 border border-gray-800 rounded p-2 text-[11px] font-mono text-white outline-none focus:border-harvest-accent"
                  />
                  <button type="submit" disabled={!chatInput.trim()} className="p-2 bg-harvest-accent/20 border border-harvest-accent/50 text-harvest-accent rounded hover:bg-harvest-accent/40 disabled:opacity-50">
                    <Send size={14} />
                  </button>
                </form>
              </>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="flex-1 flex flex-col p-4 bg-gradient-to-b from-black/20 to-black/60">
                {feedbackSent ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-harvest-accent/20 flex items-center justify-center">
                      <ThumbsUp className="text-harvest-accent" size={24} />
                    </div>
                    <p className="text-[12px] font-bold text-white uppercase tracking-widest">Intel Received</p>
                    <p className="text-[10px] text-gray-400 font-mono">Your report has been securely transmitted. Thank you.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendFeedback} className="flex-1 flex flex-col space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Classification</label>
                      <div className="grid grid-cols-3 gap-2">
                         {['bug', 'feature', 'other'].map(t => (
                           <button
                             type="button"
                             key={t}
                             onClick={() => setFeedbackType(t as any)}
                             className={`text-[9px] font-bold uppercase tracking-widest py-2 rounded border transition-colors ${
                               feedbackType === t ? 'bg-harvest-accent text-black border-harvest-accent' : 'bg-black border-gray-800 text-gray-400 hover:border-gray-600'
                             }`}
                           >
                             {t}
                           </button>
                         ))}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                        <AlertCircle size={10} /> Details
                      </label>
                      <textarea 
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Provide detailed feedback, steps to reproduce, or feature requests..."
                        className="flex-1 bg-black/50 border border-gray-800 rounded p-3 text-[11px] font-mono text-white outline-none focus:border-harvest-accent resize-none w-full"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={!feedbackText.trim()}
                      className="w-full py-3 bg-harvest-accent/10 border border-harvest-accent/50 text-harvest-accent text-[10px] font-bold uppercase tracking-widest hover:bg-harvest-accent hover:text-black transition-colors rounded disabled:opacity-50"
                    >
                      Submit Report
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
