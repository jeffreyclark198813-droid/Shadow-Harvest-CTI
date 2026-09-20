import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  Cell, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line, Area, CartesianGrid 
} from 'recharts';
import { 
  Globe, ShieldAlert, Network, Server, Cpu, PhoneCall, Zap, 
  Layers, Radio, AlertTriangle, CheckCircle2, ChevronRight, Activity, Filter, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ThreatAssessment } from '../services/dbService';

export interface InfrastructureThreatVisualizerProps {
  targets: Target[];
  assessments?: ThreatAssessment[];
  onSelectTarget?: (target: Target) => void;
}

interface RegionalThreatNode {
  region: string;
  code: string;
  threatCount: number;
  criticality: number; // 0 - 100
  activeNodes: number;
  primaryVector: string;
  epistemicLevel: 'T0' | 'T1' | 'T2' | 'T3' | 'T4';
  latencyMs: number;
  color: string;
}

interface NetworkClusterNode {
  name: string;
  cluster: string;
  exposure: number; // 0 - 100 (X)
  criticality: number; // 0 - 100 (Y)
  threatVolume: number; // Z bubble size
  sector: string;
  status: 'COMPROMISED' | 'ELEVATED' | 'MONITORED' | 'SECURED';
  vulnerabilities: string[];
  carrierLink?: string;
  epistemic: 'T0' | 'T1' | 'T2' | 'T3' | 'T4';
}

const REGIONAL_BASE_DATA: RegionalThreatNode[] = [
  { region: 'North America (US-East/West)', code: 'NA-CORE', threatCount: 14, criticality: 88, activeNodes: 38, primaryVector: 'SIP Trunking / Carrier Edge', epistemicLevel: 'T0', latencyMs: 22, color: '#ef4444' },
  { region: 'Western Europe (Frankfurt/London)', code: 'EU-WEST', threatCount: 9, criticality: 74, activeNodes: 26, primaryVector: 'DNS Interception / BGP Drift', epistemicLevel: 'T1', latencyMs: 38, color: '#f59e0b' },
  { region: 'Asia-Pacific (Tokyo/Singapore)', code: 'APAC-HQ', threatCount: 11, criticality: 82, activeNodes: 31, primaryVector: 'Encrypted C2 Relays (TLS/XMPP)', epistemicLevel: 'T2', latencyMs: 115, color: '#ec4899' },
  { region: 'Eastern Europe / CIS Frontier', code: 'EE-CIS', threatCount: 16, criticality: 94, activeNodes: 45, primaryVector: 'Ransomware Staging / Botnet C2', epistemicLevel: 'T0', latencyMs: 64, color: '#dc2626' },
  { region: 'Middle East & Gulf Transit', code: 'ME-TRANSIT', threatCount: 6, criticality: 61, activeNodes: 18, primaryVector: 'Telecom Signaling (SS7/SIP)', epistemicLevel: 'T3', latencyMs: 89, color: '#06b6d4' },
  { region: 'Latin America (São Paulo/Bogota)', code: 'LATAM-EDGE', threatCount: 5, criticality: 53, activeNodes: 14, primaryVector: 'Credential Harvesters / API Nodes', epistemicLevel: 'T2', latencyMs: 140, color: '#10b981' },
  { region: 'Global Core / Satellite Mesh', code: 'SPACE-SATCOM', threatCount: 3, criticality: 45, activeNodes: 9, primaryVector: 'Telemetry Anomaly / Timing Drift', epistemicLevel: 'T4', latencyMs: 210, color: '#8b5cf6' },
];

const NETWORK_CLUSTERS_BASE: NetworkClusterNode[] = [
  { name: 'T-Mobile Universal SIP Trunk Gateway', cluster: 'Telephony & Carrier Abstraction', exposure: 84, criticality: 92, threatVolume: 18, sector: 'Telecom Infrastructure', status: 'ELEVATED', vulnerabilities: ['Insecure Digest Auth', 'RTP Symmetric Bypass', 'SIP Port 5060 Plaintext'], carrierLink: 'TMO_TRUNK_PRIMARY', epistemic: 'T2' },
  { name: 'Primary DNS Anycast Resolver Mesh', cluster: 'Name Resolution & Routing', exposure: 72, criticality: 88, threatVolume: 14, sector: 'Core Internet Backbone', status: 'MONITORED', vulnerabilities: ['Zone Transfer Leakage', 'TTL Fast-Flux Timing Drift'], epistemic: 'T1' },
  { name: 'Public Cloud Ingress Load Balancers', cluster: 'Edge Ingress & Reverse Proxy', exposure: 90, criticality: 85, threatVolume: 22, sector: 'Cloud Edge Hosting', status: 'COMPROMISED', vulnerabilities: ['TLS 1.2 Cipher Fallback', 'HTTP Header Injection'], epistemic: 'T0' },
  { name: 'Decentralized Tor/I2P Hidden Gateway', cluster: 'Anonymity & Darknet Infrastructure', exposure: 60, criticality: 78, threatVolume: 12, sector: 'Shadow Networks', status: 'COMPROMISED', vulnerabilities: ['Circuit Correlation Attack', 'Exit Node Timing Fingerprint'], epistemic: 'T0' },
  { name: 'Federated OAuth / SAML Auth Broker', cluster: 'Identity & Access Management', exposure: 68, criticality: 95, threatVolume: 16, sector: 'Enterprise Identity', status: 'ELEVATED', vulnerabilities: ['OAuth Token Exfiltration', 'Cross-Tenant Scoping Error'], epistemic: 'T1' },
  { name: 'SCADA / ICS Remote Telemetry Concentrator', cluster: 'Industrial Control Systems', exposure: 42, criticality: 98, threatVolume: 9, sector: 'Critical Infrastructure', status: 'ELEVATED', vulnerabilities: ['Unauthenticated Modbus/TCP', 'Cleartext Telemetry Stream'], epistemic: 'T2' },
  { name: 'Carrier Media Relay (SRTP/DTLS Proxy)', cluster: 'Telephony & Carrier Abstraction', exposure: 76, criticality: 80, threatVolume: 11, sector: 'VoIP Media Transit', status: 'MONITORED', vulnerabilities: ['Weak DTLS Ciphersuite', 'SDP Crypto Injection'], carrierLink: 'TMO_MEDIA_RELAY_01', epistemic: 'T3' },
  { name: 'Cryptographic Custody Cold/Warm Nodes', cluster: 'Financial Infrastructure', exposure: 35, criticality: 90, threatVolume: 8, sector: 'FinTech / Blockchain', status: 'SECURED', vulnerabilities: ['Multisig Co-signer Drift', 'Mnemonic Heuristic Leak'], epistemic: 'T1' },
];

export const InfrastructureThreatVisualizer: React.FC<InfrastructureThreatVisualizerProps> = ({
  targets,
  assessments = [],
  onSelectTarget
}) => {
  const [viewMode, setViewMode] = useState<'geo' | 'clusters' | 'carrier' | 'radar'>('geo');
  const [selectedCluster, setSelectedCluster] = useState<NetworkClusterNode | null>(NETWORK_CLUSTERS_BASE[0]);
  const [selectedRegion, setSelectedRegion] = useState<RegionalThreatNode | null>(REGIONAL_BASE_DATA[0]);
  const [filterMinCriticality, setFilterMinCriticality] = useState<number>(0);

  // Derive dynamic counts based on target database
  const dynamicRegionalData = useMemo(() => {
    return REGIONAL_BASE_DATA.map(region => {
      // Find matching targets if any have IP/domain heuristics
      const matchingCount = targets.filter(t => {
        if (t.type === 'ip' && region.code.includes('NA') && t.status === 'active') return true;
        if (t.type === 'domain' && region.code.includes('EU')) return true;
        return false;
      }).length;
      return {
        ...region,
        threatCount: region.threatCount + matchingCount
      };
    }).filter(r => r.criticality >= filterMinCriticality);
  }, [targets, filterMinCriticality]);

  const dynamicClusterData = useMemo(() => {
    return NETWORK_CLUSTERS_BASE.filter(c => c.criticality >= filterMinCriticality);
  }, [filterMinCriticality]);

  // Telephony & Carrier Infrastructure Data (USIAF-X v∞ Specification)
  const carrierSipMetrics = [
    { protocol: 'SIP over TLS (Encrypted)', port: 5061, usagePct: 38, securityScore: 92, riskLevel: 'LOW', verifiedCarrier: 'T2 (Pending T-Mobile Spec)' },
    { protocol: 'SIP UDP/TCP (Legacy)', port: 5060, usagePct: 44, securityScore: 32, riskLevel: 'CRITICAL', verifiedCarrier: 'T0 (Observed Legacy Config)' },
    { protocol: 'SRTP / DTLS-SRTP Media', port: '10000-20000', usagePct: 28, securityScore: 88, riskLevel: 'LOW', verifiedCarrier: 'T1 (RFC Baseline)' },
    { protocol: 'Cleartext RTP Media', port: '10000-20000', usagePct: 56, securityScore: 24, riskLevel: 'HIGH', verifiedCarrier: 'T0 (Observed Payload)' },
    { protocol: 'RFC 4733 DTMF Telemetry', port: 'Inline RTP', usagePct: 78, securityScore: 80, riskLevel: 'LOW', verifiedCarrier: 'T1 (RFC 4733 Modernized)' },
  ];

  // Radar multi-vector comparison
  const radarData = [
    { dimension: 'Carrier Trunk Exposure', score: 86, baseline: 50, fullMark: 100 },
    { dimension: 'Identity Spoofing Risk', score: 72, baseline: 40, fullMark: 100 },
    { dimension: 'Signaling Cryptography', score: 45, baseline: 80, fullMark: 100 },
    { dimension: 'Blast Radius (Blast-R)', score: 91, baseline: 45, fullMark: 100 },
    { dimension: 'Epistemic Provenance', score: 88, baseline: 60, fullMark: 100 },
    { dimension: 'Anonymity Shielding', score: 64, baseline: 70, fullMark: 100 },
  ];

  // Custom Dark Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0b0f14] border border-harvest-accent/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl text-xs font-mono max-w-xs space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-harvest-accent uppercase tracking-wider">{data.region || data.name || label}</span>
            {data.code && <span className="text-[10px] text-gray-500">{data.code}</span>}
          </div>
          {data.criticality !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-400">Criticality Index:</span>
              <span className="font-bold text-red-400">{data.criticality} / 100</span>
            </div>
          )}
          {data.threatCount !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-400">Active Threats:</span>
              <span className="font-bold text-white">{data.threatCount} incidents</span>
            </div>
          )}
          {data.primaryVector && (
            <div className="text-[11px] text-gray-300">
              <span className="text-gray-500 block text-[9px] uppercase">Primary Vector:</span>
              {data.primaryVector}
            </div>
          )}
          {data.epistemicLevel && (
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">Epistemic State:</span>
              <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 rounded font-bold">{data.epistemicLevel}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-harvest-card border border-harvest-border rounded-2xl p-5 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-harvest-accent/10 border border-harvest-accent/30 text-harvest-accent">
              <Network size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                ACTIVE INFRASTRUCTURE THREAT MAPPING & TOPOLOGY
                <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-[9px] font-black tracking-widest animate-pulse">
                  LIVE CTI FEED
                </span>
              </h2>
              <p className="text-[11px] font-mono text-gray-400">
                USIAF-X Universal Taxonomy & Epistemic Cluster Criticality Engine
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-harvest-border overflow-x-auto max-w-full">
          {[
            { id: 'geo', label: 'Geographic Vectors', icon: Globe },
            { id: 'clusters', label: 'Cluster Criticality', icon: Layers },
            { id: 'carrier', label: 'SIP/VoIP Trunk Matrix', icon: PhoneCall },
            { id: 'radar', label: 'Threat Radar Profile', icon: Radio },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-harvest-accent text-black shadow-[0_0_10px_rgba(0,255,153,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visualizer Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Chart Canvas (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-80 w-full bg-black/30 border border-harvest-border/50 rounded-2xl p-4 relative overflow-hidden flex flex-col">
            {/* Chart Mode 1: Geographic Vectors (Bar / Composed) */}
            {viewMode === 'geo' && (
              <div className="flex-1 w-full h-full">
                <div className="flex justify-between items-center mb-2 text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} className="text-harvest-accent" />
                    Regional Distribution: Threat Volume vs Criticality Score
                  </span>
                  <span className="text-[10px] text-gray-500">Scale: 0 - 100</span>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <ComposedChart
                    data={dynamicRegionalData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length) {
                        setSelectedRegion(e.activePayload[0].payload);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="code" 
                      stroke="#6b7280" 
                      fontSize={10} 
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={24}
                      wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} 
                    />
                    <Bar 
                      dataKey="criticality" 
                      name="Criticality Index" 
                      fill="#ef4444" 
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    >
                      {dynamicRegionalData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.criticality > 85 ? '#ef4444' : entry.criticality > 70 ? '#f59e0b' : '#10b981'} 
                        />
                      ))}
                    </Bar>
                    <Line 
                      type="monotone" 
                      dataKey="threatCount" 
                      name="Active Threat Incidents" 
                      stroke="#00ff99" 
                      strokeWidth={2.5} 
                      dot={{ r: 4, fill: '#00ff99' }}
                      isAnimationActive={false} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart Mode 2: Network Cluster Criticality (Scatter Matrix) */}
            {viewMode === 'clusters' && (
              <div className="flex-1 w-full h-full">
                <div className="flex justify-between items-center mb-2 text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-purple-400" />
                    Cluster Topology Matrix (Exposure X vs Criticality Y vs Threat Volume Z)
                  </span>
                  <span className="text-[10px] text-gray-500">Click node to inspect</span>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart
                    margin={{ top: 10, right: 20, bottom: 20, left: -10 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length) {
                        setSelectedCluster(e.activePayload[0].payload);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis 
                      type="number" 
                      dataKey="exposure" 
                      name="Exposure Score" 
                      unit="%" 
                      stroke="#6b7280" 
                      fontSize={10} 
                      domain={[20, 100]}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="criticality" 
                      name="Criticality Index" 
                      unit="%" 
                      stroke="#6b7280" 
                      fontSize={10} 
                      domain={[40, 100]}
                    />
                    <ZAxis type="number" dataKey="threatVolume" range={[80, 400]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Network Clusters" data={dynamicClusterData} isAnimationActive={false}>
                      {dynamicClusterData.map((entry, index) => (
                        <Cell 
                          key={`scatter-${index}`} 
                          fill={entry.status === 'COMPROMISED' ? '#ef4444' : entry.status === 'ELEVATED' ? '#f59e0b' : '#00ff99'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart Mode 3: Telecom / SIP Trunking Matrix (USIAF-X SIP Forensic Spec) */}
            {viewMode === 'carrier' && (
              <div className="flex-1 w-full h-full">
                <div className="flex justify-between items-center mb-2 text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <PhoneCall size={13} className="text-cyan-400" />
                    T-Mobile / Universal Carrier Signaling & Media Security Profiles
                  </span>
                  <span className="text-[10px] text-gray-500">RFC 3261 / RFC 4733 Compliance</span>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    data={carrierSipMetrics}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" stroke="#6b7280" fontSize={10} domain={[0, 100]} unit="%" />
                    <YAxis 
                      type="category" 
                      dataKey="protocol" 
                      stroke="#9ca3af" 
                      fontSize={9} 
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={24} 
                      wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} 
                    />
                    <Bar dataKey="securityScore" name="Security & Integrity Score" fill="#00ff99" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                    <Bar dataKey="usagePct" name="Active Exposure / Traffic %" fill="#ef4444" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart Mode 4: Multi-Vector Threat Radar */}
            {viewMode === 'radar' && (
              <div className="flex-1 w-full h-full">
                <div className="flex justify-between items-center mb-2 text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Radio size={13} className="text-pink-400" />
                    Multi-Dimensional Threat Vulnerability Surface
                  </span>
                  <span className="text-[10px] text-gray-500">Systemic Posture</span>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4b5563" fontSize={8} />
                    <Radar name="Active Threat Profile" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} isAnimationActive={false} />
                    <Radar name="Hardened Baseline" dataKey="baseline" stroke="#00ff99" fill="#00ff99" fillOpacity={0.2} isAnimationActive={false} />
                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Criticality Threshold Slider */}
          <div className="flex items-center justify-between gap-4 px-2 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-2">
              <Filter size={13} className="text-harvest-accent" />
              MIN CRITICALITY THRESHOLD: <strong className="text-white">{filterMinCriticality}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={filterMinCriticality}
              onChange={e => setFilterMinCriticality(Number(e.target.value))}
              className="w-48 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-harvest-accent"
            />
          </div>
        </div>

        {/* Node Inspector & Action Sidebar (1 Col) */}
        <div className="bg-black/40 border border-harvest-border/50 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="mono-label !text-[11px] text-white flex items-center gap-1.5">
                <Server size={13} className="text-harvest-accent" />
                INFRASTRUCTURE INSPECTOR
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-harvest-accent/10 border border-harvest-accent/30 text-harvest-accent rounded">
                USIAF-X v12.0
              </span>
            </div>

            {/* Selected Node Details */}
            {viewMode === 'clusters' && selectedCluster ? (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Cluster Name:</span>
                  <h4 className="text-white font-bold text-sm">{selectedCluster.name}</h4>
                  <span className="text-[10px] text-gray-400">{selectedCluster.sector}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[9px] block">CRITICALITY</span>
                    <span className="text-red-400 font-black text-base">{selectedCluster.criticality}%</span>
                  </div>
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[9px] block">EXPOSURE</span>
                    <span className="text-amber-400 font-black text-base">{selectedCluster.exposure}%</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-gray-500 uppercase block">Epistemic State & Status:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 rounded text-[10px] font-bold">
                      {selectedCluster.epistemic} — {selectedCluster.epistemic === 'T0' ? 'Directly Observed' : selectedCluster.epistemic === 'T1' ? 'Standards Derived' : 'Carrier Dependent'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedCluster.status === 'COMPROMISED' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {selectedCluster.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-gray-500 uppercase block">Identified Vulnerabilities:</span>
                  <div className="space-y-1">
                    {selectedCluster.vulnerabilities.map((vuln, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-300 bg-white/5 px-2 py-1 rounded">
                        <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                        <span className="truncate">{vuln}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCluster.carrierLink && (
                  <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-[10px] text-cyan-300">
                    <span className="block font-bold">Carrier Link Abstraction:</span>
                    <code>{selectedCluster.carrierLink}</code>
                  </div>
                )}
              </div>
            ) : selectedRegion ? (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Geographic Theater:</span>
                  <h4 className="text-white font-bold text-sm">{selectedRegion.region}</h4>
                  <span className="text-[10px] text-gray-400">Node Identifier: {selectedRegion.code}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[9px] block">ACTIVE THREATS</span>
                    <span className="text-red-400 font-black text-base">{selectedRegion.threatCount}</span>
                  </div>
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[9px] block">AVG LATENCY</span>
                    <span className="text-cyan-400 font-black text-base">{selectedRegion.latencyMs} ms</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-gray-500 uppercase block">Primary Infiltration Vector:</span>
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-[11px] text-gray-200">
                    {selectedRegion.primaryVector}
                  </div>
                </div>

                <div className="p-2.5 bg-purple-950/20 border border-purple-800/40 rounded-xl text-[10px] text-purple-300">
                  <span className="block font-bold">Epistemic Baseline: {selectedRegion.epistemicLevel}</span>
                  <span>Non-geographic universal identity model active.</span>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-gray-500">Select any chart node to inspect telemetry.</p>
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
              <span>Target Assets Linked: {targets.length}</span>
              <span className="text-harvest-accent font-bold">REAL-TIME TELEMETRY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
