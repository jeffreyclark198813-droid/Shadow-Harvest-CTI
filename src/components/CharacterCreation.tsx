import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Terminal, Zap, User, Book, Cpu, Globe, Lock } from 'lucide-react';
import { UserPersona, saveUserPersona, calculateAnonymityScore, saveUserSettings } from '../services/dbService';
import { auth } from '../firebase';

interface CharacterCreationProps {
  onComplete: () => void;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserPersona>>({
    name: '',
    avatar: 'https://picsum.photos/seed/analyst1/200/200',
    backstory: '',
    stats: {
      hacking: 5,
      socialEngineering: 5,
      cryptography: 5,
      stealth: 5
    },
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

  const avatars = [
    'https://picsum.photos/seed/analyst1/200/200',
    'https://picsum.photos/seed/analyst2/200/200',
    'https://picsum.photos/seed/analyst3/200/200',
    'https://picsum.photos/seed/analyst4/200/200',
    'https://picsum.photos/seed/analyst5/200/200',
    'https://picsum.photos/seed/analyst6/200/200'
  ];

  const handleStatChange = (stat: keyof UserPersona['stats'], delta: number) => {
    if (!profile.stats) return;
    const currentTotal = Object.values(profile.stats).reduce((a, b) => a + b, 0);
    const newVal = Math.max(1, Math.min(10, profile.stats[stat] + delta));
    
    // Limit total points to 25 for starting
    if (delta > 0 && currentTotal >= 25) return;

    setProfile({
      ...profile,
      stats: {
        ...profile.stats,
        [stat]: newVal
      }
    });
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const anonymityScore = calculateAnonymityScore(profile.privacySettings!);

    const personaId = await saveUserPersona({
      ...profile,
      userId: user.uid,
      anonymityScore
    } as UserPersona);

    if (personaId) {
      await saveUserSettings(user.uid, { activePersonaId: personaId });
    }
    
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6 font-mono overflow-auto">
      <div className="max-w-2xl w-full bg-[#0d0d0d] border border-[#222] rounded-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#222] bg-[#111] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="text-[#00ff00]" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Character Initialization // Phase {step}</h2>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-1 rounded-full ${step >= i ? 'bg-[#00ff00]' : 'bg-[#222]'}`} />
            ))}
          </div>
        </div>

        <div className="p-8 flex-1">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest">Select Avatar</label>
                <div className="grid grid-cols-3 gap-4">
                  {avatars.map((url, i) => (
                    <button 
                      key={i}
                      onClick={() => setProfile({ ...profile, avatar: url })}
                      className={`relative aspect-square rounded border-2 transition-all overflow-hidden ${
                        profile.avatar === url ? 'border-[#00ff00] scale-105' : 'border-[#222] opacity-50 grayscale hover:grayscale-0'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {profile.avatar === url && (
                        <div className="absolute inset-0 bg-[#00ff00]/10 flex items-center justify-center">
                          <Shield size={24} className="text-[#00ff00]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest">Analyst Callsign</label>
                <input 
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  placeholder="ENTER IDENTIFIER..."
                  className="w-full bg-black border border-[#222] rounded px-4 py-3 text-sm focus:border-[#00ff00] outline-none transition-colors text-white"
                />
              </div>

              <button 
                disabled={!profile.name}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-[#00ff00] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#00cc00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Proceed to Skill Allocation
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="bg-[#1a1a1a] p-4 border border-[#333] rounded">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Allocate skill points to define your operational specialty. You have <span className="text-[#00ff00] font-bold">25 points</span> to distribute.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { key: 'hacking', label: 'Hacking', icon: Cpu, desc: 'Technical intrusion and system exploitation.' },
                  { key: 'socialEngineering', label: 'Social Engineering', icon: User, desc: 'Human manipulation and psychological profiling.' },
                  { key: 'cryptography', label: 'Cryptography', icon: Lock, desc: 'Encryption analysis and data decryption.' },
                  { key: 'stealth', label: 'Stealth', icon: Globe, desc: 'Operational security and digital footprint masking.' }
                ].map((stat) => (
                  <div key={stat.key} className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-[#111] border border-[#222] rounded flex items-center justify-center text-gray-500">
                      <stat.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{stat.label}</span>
                        <span className="text-xs font-bold text-[#00ff00]">{profile.stats?.[stat.key as keyof UserPersona['stats']]}</span>
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase mb-2">{stat.desc}</p>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 h-1 rounded-full ${
                              (profile.stats?.[stat.key as keyof UserPersona['stats']] || 0) > i ? 'bg-[#00ff00]' : 'bg-[#222]'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatChange(stat.key as any, -1)}
                        className="w-8 h-8 border border-[#222] hover:border-red-500 text-gray-500 hover:text-red-500 rounded flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => handleStatChange(stat.key as any, 1)}
                        className="w-8 h-8 border border-[#222] hover:border-[#00ff00] text-gray-500 hover:text-[#00ff00] rounded flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border border-[#222] text-gray-500 font-bold uppercase text-xs tracking-widest hover:border-white hover:text-white transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-[#00ff00] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#00cc00] transition-colors"
                >
                  Finalize Backstory
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest">Operational History / Backstory</label>
                <textarea 
                  value={profile.backstory}
                  onChange={e => setProfile({ ...profile, backstory: e.target.value })}
                  placeholder="TELL US HOW YOU JOINED THE SHADOW HARVEST..."
                  className="w-full bg-black border border-[#222] rounded px-4 py-3 text-sm focus:border-[#00ff00] outline-none transition-colors text-white h-48 resize-none"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 border border-[#222] text-gray-500 font-bold uppercase text-xs tracking-widest hover:border-white hover:text-white transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-1 py-4 bg-[#00ff00] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#00cc00] transition-colors"
                >
                  Initialize Profile
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
