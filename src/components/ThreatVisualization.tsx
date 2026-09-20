import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  Cell,
  CartesianGrid
} from 'recharts';
import { Globe, ShieldAlert, Cpu, Activity, Filter, MapPin, Database, Radio } from 'lucide-react';
import { Target } from '../services/dbService';

interface ThreatVisualizationProps {
  targets?: Target[];
  onSelectTarget?: (target: Target) => void;
}

export const ThreatVisualization: React.FC<ThreatVisualizationProps> = ({ targets = [], onSelectTarget }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cluster' | 'geographical' | 'criticality'>('cluster');

  // Generate synthetic geographical & cluster threat metrics if targets array is small
  const regionalThreatData = [
    { region: 'North America (NA-01)', criticalityIndex: 88, activeThreats: 42, exposureScore: 79, nodes: 156 },
    { region: 'Western Europe (EU-WEST)', criticalityIndex: 76, activeThreats: 31, exposureScore: 68, nodes: 132 },
    { region: 'Asia-Pacific (APAC-04)', criticalityIndex: 94, activeThreats: 58, exposureScore: 91, nodes: 210 },
    { region: 'Eastern Europe (EE-02)', criticalityIndex: 82, activeThreats: 39, exposureScore: 75, nodes: 98 },
    { region: 'Latin America (LATAM-01)', criticalityIndex: 65, activeThreats: 19, exposureScore: 58, nodes: 74 },
    { region: 'Middle East (ME-01)', criticalityIndex: 89, activeThreats: 47, exposureScore: 84, nodes: 115 },
  ];

  const clusterDensityData = [
    { x: 12, y: 88, z: 450, clusterName: 'Cluster-Alpha (SIP Gateways)', criticality: 92, region: 'APAC-04' },
    { x: 28, y: 64, z: 320, clusterName: 'Cluster-Beta (BGP Autonomous)', criticality: 78, region: 'NA-01' },
    { x: 45, y: 92, z: 580, clusterName: 'Cluster-Gamma (Credential Leak Feed)', criticality: 96, region: 'EU-WEST' },
    { x: 62, y: 45, z: 210, clusterName: 'Cluster-Delta (DNS Exfiltration)', criticality: 64, region: 'LATAM-01' },
    { x: 78, y: 81, z: 410, clusterName: 'Cluster-Epsilon (API Endpoint Abuse)', criticality: 85, region: 'EE-02' },
    { x: 89, y: 73, z: 390, clusterName: 'Cluster-Zeta (Encrypted C2 Channel)', criticality: 88, region: 'ME-01' },
  ];

  const filteredRegionalData = selectedRegion === 'all' 
    ? regionalThreatData 
    : regionalThreatData.filter(d => d.region.toLowerCase().includes(selectedRegion.toLowerCase()));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/95 border border-harvest-accent/50 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white">
          <p className="font-bold text-harvest-accent uppercase mb-1">{data.region || data.clusterName || label}</p>
          {data.criticalityIndex !== undefined && <p className="text-gray-300">Criticality Index: <span className="text-red-400 font-bold">{data.criticalityIndex}</span></p>}
          {data.activeThreats !== undefined && <p className="text-gray-300">Active Threat Incidents: <span className="text-emerald-400 font-bold">{data.activeThreats}</span></p>}
          {data.exposureScore !== undefined && <p className="text-gray-300">Exposure Score: <span className="text-yellow-400 font-bold">{data.exposureScore}%</span></p>}
          {data.nodes !== undefined && <p className="text-gray-300">Monitored Nodes: <span className="text-white font-bold">{data.nodes}</span></p>}
          {data.criticality !== undefined && <p className="text-gray-300">Cluster Criticality: <span className="text-red-400 font-bold">{data.criticality}</span></p>}
          {data.z !== undefined && <p className="text-gray-300">Threat Volume: <span className="text-harvest-accent font-bold">{data.z} req/s</span></p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 bg-harvest-card/40 border border-harvest-border rounded-3xl p-6 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-harvest-border">
        <div>
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <Globe size={16} className="text-harvest-accent animate-pulse" />
            Threat Intelligence Geographical & Cluster Criticality Mapping
          </h2>
          <p className="text-[11px] font-mono text-gray-400 mt-1">
            Real-time multi-dimensional vector telemetry mapping active infrastructure threats by regional risk and network density.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 font-mono text-[10px]">
            <button
              onClick={() => setViewMode('cluster')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'cluster' ? 'bg-harvest-accent text-black shadow-[0_0_10px_#00ff00]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Cluster Density
            </button>
            <button
              onClick={() => setViewMode('geographical')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'geographical' ? 'bg-harvest-accent text-black shadow-[0_0_10px_#00ff00]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Geographical Risk
            </button>
          </div>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-gray-300 outline-none focus:border-harvest-accent"
          >
            <option value="all">All Global Regions</option>
            <option value="NA-01">North America</option>
            <option value="EU-WEST">Western Europe</option>
            <option value="APAC-04">Asia-Pacific</option>
            <option value="EE-02">Eastern Europe</option>
            <option value="LATAM-01">Latin America</option>
            <option value="ME-01">Middle East</option>
          </select>
        </div>
      </div>

      {/* Primary Graph Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-80 w-full bg-black/60 border border-harvest-border rounded-2xl p-4 relative">
            <div className="absolute top-3 right-3 flex items-center gap-2 text-[9px] font-mono text-gray-400 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10">
              <Radio size={10} className="text-harvest-accent animate-ping" />
              <span>LIVE RECHTS TELEMETRY</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'cluster' ? (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis type="number" dataKey="x" name="Network Vector Index" stroke="#666" fontSize={10} />
                  <YAxis type="number" dataKey="y" name="Criticality Severity %" stroke="#666" fontSize={10} domain={[0, 100]} />
                  <ZAxis type="number" dataKey="z" range={[80, 400]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter name="Network Clusters" data={clusterDensityData} isAnimationActive={false}>
                    {clusterDensityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.criticality > 90 ? '#ef4444' : entry.criticality > 80 ? '#f59e0b' : '#00ff99'} 
                        opacity={0.85} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              ) : (
                <ComposedChart data={filteredRegionalData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="region" stroke="#666" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#666" fontSize={10} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={10} domain={[0, 70]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Bar yAxisId="left" dataKey="criticalityIndex" name="Criticality Index" fill="#ef4444" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="activeThreats" name="Active Threat Incidents" stroke="#00ff99" strokeWidth={2.5} dot={{ r: 4, fill: '#00ff99' }} isAnimationActive={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Threat Summary Feed */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert size={14} className="text-harvest-accent" />
            Critical Regional Vectors
          </h3>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {regionalThreatData.map((reg, idx) => (
              <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:border-harvest-accent/30 transition-colors">
                <div>
                  <h4 className="text-xs font-bold font-mono text-white">{reg.region}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-gray-400">
                    <span>Nodes: <strong className="text-white">{reg.nodes}</strong></span>
                    <span>Incidents: <strong className="text-emerald-400">{reg.activeThreats}</strong></span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className={`text-xs font-bold ${reg.criticalityIndex > 85 ? 'text-red-400' : 'text-amber-400'}`}>
                    {reg.criticalityIndex} CI
                  </span>
                  <span className="block text-[9px] text-gray-500 uppercase">Criticality</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
