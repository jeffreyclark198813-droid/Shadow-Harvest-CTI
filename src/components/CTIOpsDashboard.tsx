import React, { useState, useEffect } from 'react';
import { Target, UserPersona } from '../services/dbService';
import { 
  Shield, CheckCircle2, AlertTriangle, Activity, 
  Database, Zap, BarChart3, Globe, Lock, Cpu,
  RefreshCw, Radio
} from 'lucide-react';
import { motion } from 'motion/react';
import { ThreatHeatmap } from './ThreatHeatmap';

interface CTIOpsDashboardProps {
  targets: Target[];
  activePersona: UserPersona;
  onClose?: () => void;
}

export const CTIOpsDashboard: React.FC<CTIOpsDashboardProps> = ({ targets, activePersona }) => {
  const [load, setLoad] = useState('12.4%');
  const [throughput, setThroughput] = useState('42.8 GB/s');
  const [heatmapData, setHeatmapData] = useState<{date: Date; intensity: number}[]>([]);

  useEffect(() => {
    // Generate some mock heatmap data relative to the current targets
    const data = [];
    const baseDate = new Date();
    for (let i = 0; i < 60; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - (59 - i));
        // Add random intensity, boosting if it matches recently active targets
        const intensity = Math.floor(Math.random() * (targets.length * 2 + 5));
        data.push({ date: d, intensity });
    }
    setHeatmapData(data);

    const interval = setInterval(() => {
      setLoad(`${(Math.random() * 5 + 10).toFixed(1)}%`);
      setThroughput(`${(Math.random() * 20 + 30).toFixed(1)} GB/s`);
    }, 3000);
    return () => clearInterval(interval);
  }, [targets.length]);

  const avgConfidence = targets.length > 0 
    ? Math.round(targets.reduce((acc, t) => acc + (t.confidenceScore || 0), 0) / targets.length) 
    : 0;

  const kpis = [
    { label: 'Neural Throughput', value: throughput, icon: Zap, color: 'text-harvest-accent' },
    { label: 'System Load', value: load, icon: Activity, color: 'text-harvest-info' },
    { label: 'GIC Index', value: `${avgConfidence}%`, icon: CheckCircle2, color: 'text-harvest-accent' },
    { label: 'Privacy Gap', value: '1.2ms', icon: Lock, color: 'text-harvest-warning' }
  ];

  const sources = [
    { name: 'Dark Web Indexers', status: 'Operational', health: 98, load: 'Low' },
    { name: 'Financial Ledger Node', status: 'In Sync', health: 100, load: 'Nominal' },
    { name: 'OSINT Correlation Engine', status: 'Active', health: 94, load: 'High' },
    { name: 'Global Signal Monitor', status: 'Standby', health: 100, load: 'Idle' }
  ];

  const compliance = [
    { rule: 'Neural Encryption Protocol', status: activePersona.privacySettings.encryptedStorage },
    { rule: 'Multi-hop Tunneling (Tor)', status: activePersona.privacySettings.torRouting || activePersona.privacySettings.vpnEnabled },
    { rule: 'Metadata Sanitization', status: activePersona.privacySettings.metadataScrubbing },
    { rule: 'Footprint Minimization', status: activePersona.privacySettings.dataSharingLevel !== 'full' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Scrollers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="hardware-surface p-4 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <p className="mono-label !text-[8px] mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold font-mono tracking-tighter ${kpi.color}`}>{kpi.value}</p>
            </div>
            <kpi.icon size={32} className="absolute -right-2 -bottom-2 opacity-5" />
          </motion.div>
        ))}
      </div>

      <div className="hardware-surface p-4">
        <h2 className="mono-label mb-4 flex items-center gap-2">
          <Activity size={12} className="text-harvest-accent" />
          Live Threat Telemetry History
        </h2>
        <ThreatHeatmap data={heatmapData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="mono-label flex items-center gap-2">
              <Database size={12} className="text-harvest-info" />
              Intelligence Nodes
            </h2>
            <div className="flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-harvest-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-harvest-accent"></span>
              </span>
              <span className="text-[9px] font-bold text-harvest-accent uppercase">Live Sync</span>
            </div>
          </div>
          
          <div className="hardware-surface overflow-hidden">
            {sources.map((source, i) => (
              <div key={i} className="p-4 border-b border-harvest-border last:border-0 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-tighter">{source.name}</h4>
                  <p className="text-[9px] text-gray-600 uppercase mt-0.5">{source.status}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-mono text-gray-400">{source.health}%</p>
                    <div className="w-16 h-1 bg-gray-900 rounded-full mt-1">
                      <div className="h-full bg-harvest-info" style={{ width: `${source.health}%` }} />
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded bg-harvest-bg border border-harvest-border flex items-center justify-center">
                    <Radio size={14} className={source.health > 95 ? 'text-harvest-accent' : 'text-harvest-warning'} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Compliance */}
        <div className="space-y-4">
          <h2 className="mono-label flex items-center gap-2">
            <Shield size={12} className="text-harvest-warning" />
            Policy Adherence
          </h2>
          <div className="hardware-surface p-6 space-y-6">
            {compliance.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                  item.status ? 'bg-harvest-accent/10 border border-harvest-accent/30' : 'bg-harvest-danger/10 border border-harvest-danger/30'
                }`}>
                  {item.status ? <CheckCircle2 size={16} className="text-harvest-accent" /> : <AlertTriangle size={16} className="text-harvest-danger" />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-300 uppercase font-bold tracking-tight">{item.rule}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-[2px] bg-gray-900">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: item.status ? '100%' : '0%' }}
                        className={`h-full ${item.status ? 'bg-harvest-accent' : 'bg-harvest-danger'}`} 
                      />
                    </div>
                    <span className="mono-label !text-[8px]">{item.status ? 'Optimal' : 'Compromised'}</span>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-harvest-border flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-white uppercase">Overall Integrity</p>
                <p className="text-[8px] text-gray-600 uppercase tracking-widest">Aggregate Shadow Score</p>
              </div>
              <p className="text-2xl font-bold text-harvest-accent font-mono">
                {Math.round((compliance.filter(c => c.status).length / compliance.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Event Hook */}
      <div className="hardware-surface p-6 bg-gradient-to-br from-harvest-accent/5 to-transparent border-harvest-accent/20">
        <div className="flex items-center gap-3 mb-4">
          <Zap size={20} className="text-harvest-accent active-pulse p-1 bg-harvest-accent/10 rounded" />
          <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Real-Time Synthesis</h3>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed italic">
          Aggregate data science precision methodologies indicate a 0.04% drift in behavioral signatures across monitored darknet nodes. Predictive engines suggest a high-probability credential rotation event in the next 12 hours.
        </p>
        <div className="mt-4 flex gap-2">
          <button className="hardware-button !py-1 !text-[9px]">Reinforce Guardrails</button>
          <button className="hardware-button-primary !py-1 !text-[9px]">Deploy Counter-Intel</button>
        </div>
      </div>
    </div>
  );
};
