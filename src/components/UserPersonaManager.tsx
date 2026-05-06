import React, { useState } from 'react';
import { 
  UserPersona, saveUserPersona, saveUserSettings, 
  calculateAnonymityScore, exportUserData, importUserData 
} from '../services/dbService';
import { 
  User, Shield, Settings, 
  Plus, ChevronRight, Check, Lock, Globe, Zap, 
  EyeOff, HardDrive, Cpu, Terminal, Info, Download, Upload, RefreshCw, AlertTriangle, X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';

interface UserPersonaManagerProps {
  personas: UserPersona[];
  activePersona: UserPersona;
  onClose?: () => void;
}

export const UserPersonaManager: React.FC<UserPersonaManagerProps> = ({
  personas,
  activePersona,
}) => {
  const [view, setView] = useState<'list' | 'edit' | 'system'>('list');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'info' | 'success' | 'error', text: string } | null>(null);
  const [editingPersona, setEditingPersona] = useState<Partial<UserPersona> | null>(null);

  const handleSwitchPersona = async (personaId: string) => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    await saveUserSettings(auth.currentUser.uid, { activePersonaId: personaId });
    setIsProcessing(false);
  };

  const handleExport = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: 'Compiling neural backup...' });
    try {
      const bundle = await exportUserData(auth.currentUser.uid);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shadow_harvest_${activePersona.name.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Intelligence bundle exported.' });
    } catch (error) {
      setStatusMsg({ type: 'error', text: 'Export failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: 'Injecting restoration payload...' });
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bundle = JSON.parse(event.target?.result as string);
        await importUserData(auth.currentUser!.uid, bundle);
        setStatusMsg({ type: 'success', text: 'Neural patterns restored.' });
      } catch (error) {
        setStatusMsg({ type: 'error', text: 'Restoration failed. Integrity check error.' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSavePersona = async () => {
    if (!auth.currentUser || !editingPersona?.name) return;
    
    const anonymityScore = calculateAnonymityScore(editingPersona.privacySettings!);
    
    await saveUserPersona({
      ...editingPersona,
      userId: auth.currentUser.uid,
      anonymityScore
    } as UserPersona);

    setEditingPersona(null);
    setView('list');
  };

  const startNewPersona = () => {
    setEditingPersona({
      name: '',
      avatar: `https://picsum.photos/seed/${Math.random()}/200/200`,
      backstory: '',
      stats: { hacking: 1, socialEngineering: 1, cryptography: 1, stealth: 1 },
      privacySettings: {
        vpnEnabled: false,
        torRouting: false,
        dataSharingLevel: 'minimal',
        encryptedStorage: true,
        metadataScrubbing: false
      },
      level: 1,
      xp: 0
    });
    setView('edit');
  };

  const toggleSetting = (key: keyof UserPersona['privacySettings']) => {
    if (!editingPersona) return;
    const current = editingPersona.privacySettings!;
    setEditingPersona({
      ...editingPersona,
      privacySettings: {
        ...current,
        [key]: !current[key]
      }
    });
  };

  if (view === 'edit' && editingPersona) {
    const currentAnonymity = calculateAnonymityScore(editingPersona.privacySettings!);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setView('list')} className="p-2 -ml-2 text-gray-400"><X /></button>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Persona Configuration</h2>
        </div>

        <div className="hardware-surface p-6 space-y-6">
          <div className="space-y-4">
            <label className="mono-label">Identity Callsign</label>
            <input 
              type="text"
              value={editingPersona.name}
              onChange={e => setEditingPersona({ ...editingPersona, name: e.target.value })}
              className="w-full bg-harvest-bg border border-harvest-border rounded-xl p-4 text-sm text-white focus:border-harvest-accent outline-none"
              placeholder="ENTER CODENAME..."
            />
          </div>

          <div className="space-y-4">
             <label className="mono-label flex items-center gap-2">
              <Shield size={12} className="text-harvest-accent" />
              Obsfucation Score: {currentAnonymity.value}%
            </label>
            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentAnonymity.value}%` }}
                className="h-full bg-harvest-accent" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'vpnEnabled', label: 'VPN Tunnel', icon: Globe },
              { key: 'torRouting', label: 'Tor Link', icon: EyeOff },
              { key: 'metadataScrubbing', label: 'Data Scrub', icon: Zap },
              { key: 'encryptedStorage', label: 'Encryption', icon: Lock },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSetting(s.key as any)}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                  editingPersona.privacySettings?.[s.key as keyof UserPersona['privacySettings']]
                    ? 'bg-harvest-accent/10 border-harvest-accent/50 text-harvest-accent'
                    : 'bg-harvest-bg border-harvest-border text-gray-500'
                }`}
              >
                <s.icon size={16} />
                <span className="text-[10px] font-bold uppercase">{s.label}</span>
                <div className={`ml-auto w-4 h-4 rounded-full border flex items-center justify-center ${
                  editingPersona.privacySettings?.[s.key as keyof UserPersona['privacySettings']] ? 'bg-harvest-accent border-harvest-accent' : 'border-gray-700'
                }`}>
                  {editingPersona.privacySettings?.[s.key as keyof UserPersona['privacySettings']] && <Check size={10} className="text-black" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSavePersona}
          className="hardware-button-primary w-full"
          disabled={!editingPersona.name}
        >
          Initialize Pattern
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Tabs */}
      <div className="flex bg-harvest-card p-1 rounded-xl border border-harvest-border">
        <button 
          onClick={() => setView('list')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'list' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-500 hover:text-white'}`}
        >
          Identities
        </button>
        <button 
          onClick={() => setView('system')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'system' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-500 hover:text-white'}`}
        >
          System
        </button>
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="mono-label">Active Neural Links</h2>
            <button 
              onClick={startNewPersona}
              className="text-harvest-accent hover:bg-harvest-accent/10 p-2 rounded-full transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {personas.map(p => (
              <motion.div 
                key={p.id}
                layoutId={p.id}
                className={`hardware-surface p-4 flex items-center justify-between group ${activePersona.id === p.id ? 'ring-1 ring-harvest-accent/50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={p.avatar} className="w-12 h-12 rounded-xl border border-harvest-border object-cover" referrerPolicy="no-referrer" />
                    {activePersona.id === p.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-harvest-accent rounded-full border-2 border-harvest-bg flex items-center justify-center">
                        <Check size={8} className="text-black" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tighter">{p.name}</h3>
                    <p className="mono-label !text-[8px] mt-0.5">Lvl {p.level} Analyst • {p.anonymityScore?.value}% Stealth</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setEditingPersona(p); setView('edit'); }}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Settings size={18} />
                  </button>
                  {activePersona.id !== p.id && (
                    <button 
                      onClick={() => handleSwitchPersona(p.id!)}
                      className="hardware-button !py-1.5 !px-3 !text-[9px]"
                      disabled={isProcessing}
                    >
                      Sync
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="mono-label px-2">Neural Backup & Recovery</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="hardware-surface p-6 space-y-4 bg-gradient-to-br from-harvest-accent/5 to-transparent border-harvest-accent/20">
              <div className="w-12 h-12 rounded-xl bg-harvest-accent/10 flex items-center justify-center text-harvest-accent border border-harvest-accent/20">
                <Download size={24} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase font-mono">Export Intelligence</h3>
              <p className="text-[10px] text-gray-500 uppercase leading-relaxed">Compile all personas and investigation data into an encrypted neural bundle.</p>
              <button 
                onClick={handleExport}
                className="hardware-button-primary w-full !py-2"
                disabled={isProcessing}
              >
                Initiate Backup
              </button>
            </div>

            <div className="hardware-surface p-6 space-y-4 bg-gradient-to-br from-harvest-info/5 to-transparent border-harvest-info/20">
              <div className="w-12 h-12 rounded-xl bg-harvest-info/10 flex items-center justify-center text-harvest-info border border-harvest-info/20">
                <Upload size={24} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase font-mono">Import Intelligence</h3>
              <p className="text-[10px] text-gray-500 uppercase leading-relaxed">Restore previously exported neural patterns. Existing data may be overwritten.</p>
              <label className="block w-full">
                <div className="hardware-button-primary w-full !py-2 !bg-harvest-info !border-harvest-info text-center cursor-pointer">Inject Bundle</div>
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
             <AlertTriangle className="text-red-500 mt-0.5" size={16} />
             <p className="text-[9px] text-gray-500 uppercase leading-relaxed">
               Neural bundles contain sensitive biometric and identifying data. Use of insecure transport protocols may lead to total operational compromise.
             </p>
          </div>
        </div>
      )}

      {/* Status Toasts */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-24 left-6 right-6 p-4 rounded-xl border z-[300] shadow-2xl backdrop-blur-md flex items-center justify-between ${
              statusMsg.type === 'success' ? 'bg-harvest-accent/10 border-harvest-accent text-harvest-accent' :
              statusMsg.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' :
              'bg-harvest-info/10 border-harvest-info text-harvest-info'
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMsg.type === 'success' ? <Check size={18} /> : statusMsg.type === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
              <span className="text-[10px] font-bold uppercase tracking-widest">{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="p-1"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
