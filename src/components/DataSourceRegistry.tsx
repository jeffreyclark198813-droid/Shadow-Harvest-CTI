import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { APISource } from '../types/intelligence_ops';
import { subscribeToAPISources } from '../services/dbService';
import { 
  Server, 
  Activity, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Lock,
  Globe
} from 'lucide-react';

export const DataSourceRegistry: React.FC = () => {
  const [sources, setSources] = useState<APISource[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAPISources(setSources);
    return () => unsub();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-harvest-accent';
      case 'degraded': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      case 'maintenance': return 'text-blue-400';
      default: return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-harvest-accent/10';
      case 'degraded': return 'bg-yellow-500/10';
      case 'offline': return 'bg-red-500/10';
      case 'maintenance': return 'bg-blue-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  // Mock data if Firestore is empty
  const displaySources = sources.length > 0 ? sources : [
    {
      id: 'src-1',
      name: 'Shodan Global Scan',
      endpoint: 'https://api.shodan.io',
      status: 'healthy' as const,
      lastChecked: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      rateLimit: { consumed: 450, total: 1000, resetAt: { seconds: (Date.now() + 3600000) / 1000, nanoseconds: 0 } as any },
      license: { type: 'Enterprise', expiresAt: { seconds: (Date.now() + 86400000 * 30) / 1000, nanoseconds: 0 } as any, provider: 'Shodan.io' }
    },
    {
      id: 'src-2',
      name: 'VirusTotal Intelligence',
      endpoint: 'https://www.virustotal.com/api/v3',
      status: 'degraded' as const,
      lastChecked: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      rateLimit: { consumed: 890, total: 1000, resetAt: { seconds: (Date.now() + 1800000) / 1000, nanoseconds: 0 } as any },
      license: { type: 'Gov-Cloud', expiresAt: { seconds: (Date.now() + 86400000 * 120) / 1000, nanoseconds: 0 } as any, provider: 'Google Cloud' }
    },
    {
      id: 'src-3',
      name: 'Chainalysis Reactor',
      endpoint: 'https://api.chainalysis.com',
      status: 'healthy' as const,
      lastChecked: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      rateLimit: { consumed: 120, total: 5000, resetAt: { seconds: (Date.now() + 7200000) / 1000, nanoseconds: 0 } as any },
      license: { type: 'Full Trace', expiresAt: { seconds: (Date.now() + 86400000 * 15) / 1000, nanoseconds: 0 } as any, provider: 'Chainalysis' }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="mono-label text-gray-400 flex items-center gap-2">
            <Server size={12} className="text-harvest-accent" />
            DATA SOURCE REGISTRY
          </h2>
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter mt-1 italic">Authorized T0/T1 Intelligence Feed Aggregators</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="hardware-button-primary !py-2 !px-4 !text-[10px] flex items-center gap-2"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          RESCAN ENDPOINTS
        </button>
      </div>

      <div className="hardware-surface overflow-hidden border-harvest-border bg-harvest-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-harvest-border">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Source Entity</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Connection Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rate Consumption</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">License/Metadata</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displaySources.map((source) => (
              <tr key={source.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-gray-900 border border-harvest-border group-hover:border-harvest-accent/30 transition-all`}>
                      <Globe size={18} className="text-gray-400 group-hover:text-harvest-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tighter">{source.name}</h4>
                      <p className="text-[9px] text-gray-600 font-mono flex items-center gap-1 mt-0.5">
                        <Lock size={8} />
                        {source.endpoint.replace('https://', '')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusBg(source.status)} ${getStatusColor(source.status).replace('text-', 'border-')}`}>
                    <Activity size={12} className={source.status === 'healthy' ? 'animate-pulse' : ''} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getStatusColor(source.status)}`}>
                      {source.status}
                    </span>
                  </div>
                  <p className="text-[8px] text-gray-600 mt-2 font-mono flex items-center gap-1">
                    <Clock size={10} />
                    LAST SYNC: {new Date(source.lastChecked.seconds * 1000).toLocaleTimeString()}
                  </p>
                </td>
                <td className="px-6 py-5">
                  <div className="w-full max-w-[160px] space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-500">CONSUMPTION</span>
                      <span className="text-white">{Math.round((source.rateLimit.consumed / source.rateLimit.total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(source.rateLimit.consumed / source.rateLimit.total) * 100}%` }}
                        className={`h-full ${
                          (source.rateLimit.consumed / source.rateLimit.total) > 0.8 ? 'bg-red-500' : 'bg-harvest-accent'
                        }`}
                      />
                    </div>
                    <p className="text-[8px] text-gray-600 font-mono">
                      {source.rateLimit.consumed} / {source.rateLimit.total} REQ <span className="mx-1">|</span> 
                      RESET: {new Date(source.rateLimit.resetAt.seconds * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-400" />
                      <span className="text-[10px] font-bold text-white uppercase">{source.license.type}</span>
                    </div>
                    <p className="text-[9px] text-gray-500">PROVIDER: {source.license.provider}</p>
                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-1">
                      EXPIRES: {new Date(source.license.expiresAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/5 hover:bg-harvest-accent/20 rounded text-gray-500 hover:text-harvest-accent transition-all border border-transparent hover:border-harvest-accent/30">
                      <ExternalLink size={14} />
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-harvest-accent hover:text-black rounded text-gray-500 transition-all">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="hardware-surface p-4 bg-white/[0.01] flex items-center gap-4">
          <div className="p-3 bg-harvest-accent/10 rounded-xl">
            <Globe size={20} className="text-harvest-accent" />
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Global Reach</p>
            <p className="text-xl font-bold text-white tracking-tighter">142 FEED NODES</p>
          </div>
        </div>
        <div className="hardware-surface p-4 bg-white/[0.01] flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Lock size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Identity Sync</p>
            <p className="text-xl font-bold text-white tracking-tighter">AES-256 ROTATION</p>
          </div>
        </div>
        <div className="hardware-surface p-4 bg-white/[0.01] flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <Activity size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Ingest Latency</p>
            <p className="text-xl font-bold text-white tracking-tighter">14ms AVERAGE</p>
          </div>
        </div>
      </div>
    </div>
  );
};
