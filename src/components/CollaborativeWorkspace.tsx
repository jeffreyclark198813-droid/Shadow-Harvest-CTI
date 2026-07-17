import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { io, Socket } from 'socket.io-client';
import { generateAIAutocomplete } from '../services/geminiService';
import { Loader2, Users, Save, Cpu, MousePointer2, MessageSquare } from 'lucide-react';
import { auth } from '../firebase';

export const CollaborativeWorkspace: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const [content, setContent] = useState('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const socketRef = useRef<Socket | null>(null);
  const textRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<IndexeddbPersistence | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ydoc = ydocRef.current;
    const text = ydoc.getText('workspace-content');
    textRef.current = text;

    // Offline Persistence
    const provider = new IndexeddbPersistence(`workspace-${workspaceId}`, ydoc);
    providerRef.current = provider;
    
    provider.on('synced', () => {
      setContent(text.toString());
    });

    // Real-time Collaboration Engine
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.emit('join-workspace', workspaceId);

    socket.on('document-changed', (data: any) => {
      if (data.userId !== socket.id) {
        Y.applyUpdate(ydoc, new Uint8Array(data.update));
      }
    });

    socket.on('cursor-update', (data: any) => {
      setCollaborators(prev => {
        const existing = prev.find(c => c.userId === data.userId);
        if (existing) {
          return prev.map(c => c.userId === data.userId ? data : c);
        }
        return [...prev, data];
      });
    });

    ydoc.on('update', (update) => {
      setContent(text.toString());
      setIsSyncing(true);
      socket.emit('document-update', {
        workspaceId,
        userId: socket.id,
        update: Array.from(update)
      });
      setTimeout(() => setIsSyncing(false), 500);
    });

    return () => {
      socket.disconnect();
      provider.destroy();
      ydoc.destroy();
    };
  }, [workspaceId]);

  const handleCursorMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!socketRef.current || !editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    socketRef.current.emit('cursor-move', {
      workspaceId,
      userId: socketRef.current.id,
      x,
      y,
      name: auth.currentUser?.email || 'Anonymous'
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const text = textRef.current;
    if (text) {
      // Very basic operational transform (replace all for simplicity in demo)
      // A robust implementation would use a rich text editor plugin for Yjs (like y-prosemirror)
      ydocRef.current.transact(() => {
        text.delete(0, text.length);
        text.insert(0, newContent);
      });
    }
  };

  const requestAutocomplete = async () => {
    if (!content) return;
    setAiSuggestion('...');
    try {
      const suggestion = await generateAIAutocomplete(content);
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error(err);
      setAiSuggestion(null);
    }
  };

  const acceptSuggestion = () => {
    if (aiSuggestion && aiSuggestion !== '...') {
      const text = textRef.current;
      if (text) {
        ydocRef.current.transact(() => {
          text.insert(text.length, ' ' + aiSuggestion);
        });
      }
      setAiSuggestion(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Collaborative Workspace</h2>
          <span className="text-xs px-2 py-1 bg-slate-700 rounded-full text-slate-300 ml-2">
            {collaborators.length + 1} Active
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={requestAutocomplete}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
          >
            <Cpu className="w-4 h-4" />
            AI Autocomplete
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Save className="w-4 h-4" />}
            {isSyncing ? 'Syncing...' : 'Saved Offline'}
          </div>
        </div>
      </div>
      
      <div className="relative flex-1 p-4" onMouseMove={handleCursorMove} onTouchMove={handleCursorMove}>
        {collaborators.map(c => (
          <div 
            key={c.userId} 
            className="absolute pointer-events-none transition-all duration-200 z-50"
            style={{ left: c.x + 16, top: c.y + 16 }}
          >
            <MousePointer2 className="w-4 h-4 text-rose-500 fill-rose-500 transform -rotate-12" />
            <div className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mt-1">
              {c.name}
            </div>
          </div>
        ))}
        
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleInput}
          placeholder="Start typing to collaborate in real-time. Data is automatically synced and stored offline via CRDTs."
          className="w-full h-full bg-slate-800/50 text-slate-200 border-0 outline-none resize-none rounded-md p-4 font-mono text-sm leading-relaxed"
        />
        
        {aiSuggestion && (
          <div className="absolute bottom-8 right-8 max-w-sm bg-slate-800 border border-indigo-500/50 rounded-lg p-3 shadow-xl z-40">
            <div className="flex items-start justify-between gap-4 mb-2">
              <span className="text-xs font-semibold text-indigo-400">AI Suggestion</span>
              <button onClick={() => setAiSuggestion(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
            </div>
            <p className="text-sm text-slate-300 italic mb-3">"{aiSuggestion}"</p>
            {aiSuggestion !== '...' && (
              <button 
                onClick={acceptSuggestion}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
              >
                Accept & Insert (Tab)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
