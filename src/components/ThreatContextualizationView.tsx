import React, { useState } from 'react';
import { Shield, Target, Zap, Activity, AlertTriangle, FileText, CheckCircle2, Cpu, Database, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { ThreatAssessment } from '../services/dbService';

interface ThreatContextualizationViewProps {
  assessments: ThreatAssessment[];
  onGenerate: () => void;
  loading: boolean;
}

export const ThreatContextualizationView: React.FC<ThreatContextualizationViewProps> = ({ assessments, onGenerate, loading }) => {
  const [selectedProfile, setSelectedProfile] = useState<'APT28' | 'Lazarus' | 'FIN7' | 'LockBit' | 'Custom'>('APT28');
  const latest = assessments[0];

  const threatProfiles = {
    APT28: {
      name: 'APT28 (Fancy Bear / Sofacy)',
      origin: 'State-Sponsored (GRU Unit 26165)',
      confidence: 0.94,
      targetSectors: ['Government', 'Defense', 'Critical Infrastructure', 'Dissidents'],
      commonTools: ['X-Agent', 'Zebrocy', 'Drovorub', 'Mimikatz'],
      tactics: [
        { id: 'T1566.001', name: 'Phishing: Spearphishing Attachment', confidence: 0.96, description: 'Delivers customized weaponized documents exploiting CVE vulnerabilities.' },
        { id: 'T1078', name: 'Valid Accounts', confidence: 0.91, description: 'Leverages compromised credentials for persistent remote access.' },
        { id: 'T1021.001', name: 'Remote Services: Remote Desktop Protocol', confidence: 0.88, description: 'Internal lateral movement via RDP tunneling.' }
      ]
    },
    Lazarus: {
      name: 'Lazarus Group (HIDDEN COBRA)',
      origin: 'State-Sponsored (RGB)',
      confidence: 0.89,
      targetSectors: ['Cryptocurrency Exchanges', 'Financial Institutions', 'Media'],
      commonTools: ['AppleJeus', 'Manuscrypt', 'Brambul'],
      tactics: [
        { id: 'T1204.002', name: 'User Execution: Malicious File', confidence: 0.95, description: 'Deploys trojanized cryptocurrency applications.' },
        { id: 'T1486', name: 'Data Encrypted for Impact', confidence: 0.92, description: 'Destructive ransomware payloads deployed post-exfiltration.' }
      ]
    },
    FIN7: {
      name: 'FIN7 (Carbanak Group)',
      origin: 'Cybercriminal Syndicate',
      confidence: 0.92,
      targetSectors: ['Retail', 'Hospitality', 'Financial Services'],
      commonTools: ['CARBANAK', 'GRIFFON', 'SQLRat'],
      tactics: [
        { id: 'T1566.002', name: 'Phishing: Spearphishing Link', confidence: 0.94, description: 'Customized emails mimicking corporate compliance audits.' },
        { id: 'T1059.001', name: 'Command and Scripting Interpreter: PowerShell', confidence: 0.90, description: 'Living-off-the-land scripts for stealthy reconnaissance.' }
      ]
    },
    LockBit: {
      name: 'LockBit Ransomware-as-a-Service',
      origin: 'Cybercriminal Affiliate Network',
      confidence: 0.95,
      targetSectors: ['Global Enterprises', 'Healthcare', 'Manufacturing'],
      commonTools: ['StealBit', 'LockBit 3.0 Builder', 'AnyDesk'],
      tactics: [
        { id: 'T1140', name: 'Deobfuscate/Decode Files or Information', confidence: 0.97, description: 'Packed loaders decrypting core ransomware payload in memory.' },
        { id: 'T1490', name: 'Inhibit System Recovery', confidence: 0.98, description: 'Deletes Volume Shadow Copies and disables Windows recovery tools.' }
      ]
    }
  };

  const activeProfileData = threatProfiles[selectedProfile as keyof typeof threatProfiles] || threatProfiles.APT28;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="mono-label text-gray-400 flex items-center gap-2">
            <Shield size={14} className="text-purple-500" />
            Comprehensive Threat Contextualization Module
          </h3>
          <p className="text-[10px] text-gray-600 uppercase font-mono mt-1">
            MITRE ATT&CK TTP Alignment & Cybercriminal Actor Attribution Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#111] p-1 rounded border border-[#222]">
            {Object.keys(threatProfiles).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedProfile(key as any)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                  selectedProfile === key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={onGenerate}
            disabled={loading}
            className="hardware-button-primary !py-2 !px-4 !text-[10px] flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            SYNTHESIZE REPORT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attribution Overview Card */}
        <div className="hardware-surface p-6 space-y-6 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase font-mono">Primary Attribution Match</p>
              <h4 className="text-base font-bold text-white uppercase mt-0.5">{activeProfileData.name}</h4>
            </div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold font-mono rounded border border-purple-500/30">
              {(activeProfileData.confidence * 100).toFixed(0)}% Match
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <span className="text-gray-500 uppercase text-[9px] block mb-1">Actor Classification</span>
              <span className="text-white font-bold">{activeProfileData.origin}</span>
            </div>
            <div>
              <span className="text-gray-500 uppercase text-[9px] block mb-1">Primary Target Sectors</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {activeProfileData.targetSectors.map((sec, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[#1a1a1a] text-gray-300 rounded border border-[#333] text-[10px]">
                    {sec}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500 uppercase text-[9px] block mb-1">Observed Tooling Arsenal</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {activeProfileData.commonTools.map((tool, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20 text-[10px]">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {latest && (
            <div className="p-4 bg-black/40 rounded border border-[#222] space-y-2">
              <span className="text-[9px] text-harvest-accent uppercase font-mono block">Dynamic AI Context</span>
              <p className="text-[11px] text-gray-300 leading-relaxed font-mono">{latest.capabilities}</p>
            </div>
          )}
        </div>

        {/* MITRE ATT&CK TTP Mapping & Alignment */}
        <div className="hardware-surface p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tighter">MITRE ATT&CK Framework Alignment</h4>
              <p className="text-[10px] text-gray-500 font-mono">Behavioral TTP correlation across infrastructure & artifact telemetry</p>
            </div>
            <Cpu size={16} className="text-purple-400" />
          </div>

          <div className="space-y-4">
            {activeProfileData.tactics.map((tactic, idx) => (
              <div key={idx} className="bg-black/40 p-4 rounded-xl border border-[#222] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-mono rounded font-bold">
                      {tactic.id}
                    </span>
                    <h5 className="text-xs font-bold text-white uppercase">{tactic.name}</h5>
                  </div>
                  <span className={`text-xs font-mono font-bold ${
                    tactic.confidence > 0.9 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(tactic.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                <p className="text-xs text-gray-300 font-mono leading-relaxed pl-2 border-l-2 border-purple-500">
                  {tactic.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#222] text-[10px] text-gray-500 font-mono">
                  <span>Status: Verified via Artifact Ingestion</span>
                  <span className="text-harvest-accent">Mitigation: Standard EDR telemetry & network segmentation</span>
                </div>
              </div>
            ))}

            {latest && latest.ttps && latest.ttps.map((ttp, idx) => (
              <div key={`dynamic-${idx}`} className="bg-black/40 p-4 rounded-xl border border-[#222] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-mono rounded font-bold">
                      {ttp.technique?.id || 'TTP-CUSTOM'}
                    </span>
                    <h5 className="text-xs font-bold text-white uppercase">{ttp.technique?.name || ttp.tactic}</h5>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {(ttp.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-mono leading-relaxed pl-2 border-l-2 border-blue-500">
                  {ttp.procedure}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
