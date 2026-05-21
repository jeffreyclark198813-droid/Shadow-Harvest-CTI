import React, { useState, useEffect } from 'react';
import { UserSettings, saveUserSettings } from '../services/dbService';
import { ACHIEVEMENTS_DEF } from '../constants/achievements';
import { Trophy, Upload, User, PenTool, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { notify } from './Toaster';
import { auth } from '../firebase';

interface UserProfileViewProps {
  settings: UserSettings | null;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ settings }) => {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(settings?.username || '');
  const [bio, setBio] = useState(settings?.bio || '');
  const [avatar, setAvatar] = useState(settings?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${auth.currentUser?.uid || 'user'}`);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.username) setUsername(settings.username);
      if (settings.bio) setBio(settings.bio);
      if (settings.avatar) setAvatar(settings.avatar);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await saveUserSettings(auth.currentUser.uid, {
        ...(settings || { activePersonaId: '' }),
        username,
        bio,
        avatar
      });
      notify({ type: 'success', title: 'Profile Updated', message: 'Operator profile saved successfully.' });
      setEditing(false);
    } catch (e: any) {
      notify({ type: 'error', title: 'Update Failed', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const unlockedIds = settings?.achievements?.map(a => a.id) || [];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-[#111] border border-[#222] rounded p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border border-[#333] overflow-hidden bg-[#1a1a1a]">
              <img src={avatar} alt="Operator Avatar" className="w-full h-full object-cover" />
            </div>
            {editing && (
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={20} className="text-white" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => setAvatar(e.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            {editing ? (
              <div className="space-y-3 max-w-sm">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Operator Call Sign</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="Enter call sign..."
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Service Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-gray-300 focus:border-blue-500 outline-none h-20 resize-none"
                    placeholder="Brief background or operational focus..."
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="hardware-button px-4 py-1.5 bg-blue-500/20 text-blue-500 border-blue-500/30 flex items-center gap-2">
                    <CheckCircle2 size={12} /> <span className="text-[10px] uppercase font-bold tracking-widest">Save</span>
                  </button>
                  <button onClick={() => setEditing(false)} className="hardware-button px-4 py-1.5 text-gray-400 border-[#333] hover:text-white flex items-center gap-2">
                    <X size={12} /> <span className="text-[10px] uppercase font-bold tracking-widest">Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{username || 'UNKNOWN OPERATOR'}</h2>
                <div className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-2 justify-center md:justify-start">
                  <User size={12} /> Clearance: {settings?.role || 'user'}
                </div>
                <p className="text-sm text-gray-400 font-mono italic max-w-lg mx-auto md:mx-0">
                  {bio || "Status: Active. No operational background provided."}
                </p>
                <button 
                  onClick={() => setEditing(true)}
                  className="mt-4 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-blue-400 transition-colors mx-auto md:mx-0"
                >
                  <PenTool size={12} /> Edit Profile
                </button>
              </div>
            )}
          </div>
          
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Op Stats</p>
            <div className="flex gap-6">
              <div>
                <span className="block text-2xl font-black text-white">{settings?.stats?.actionsTaken || 0}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest">Actions</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-white">{settings?.stats?.targetsViewed || 0}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest">Targets</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Trophy size={14} className="text-yellow-500" />
          Operational Achievements ({unlockedIds.length}/{ACHIEVEMENTS_DEF.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS_DEF.map((ach) => {
            const isUnlocked = unlockedIds.includes(ach.id);
            const achievementRec = settings?.achievements?.find(a => a.id === ach.id);
            const Icon = ach.icon;
            
            return (
              <div 
                key={ach.id} 
                className={`border p-4 flex gap-4 transition-all duration-500 ${isUnlocked ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#0a0a0a] border-[#111] opacity-50 grayscale'}`}
              >
                <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${isUnlocked ? ach.bg : 'bg-[#222]'}`}>
                  <Icon size={20} className={isUnlocked ? ach.color : 'text-gray-600'} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">{ach.title}</h4>
                  <p className="text-[10px] text-gray-500 font-mono leading-snug mt-1">{ach.description}</p>
                  {isUnlocked && achievementRec && (
                    <p className="text-[8px] text-blue-400 uppercase tracking-widest mt-2 block">
                      Unlocked: {new Date(achievementRec.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
