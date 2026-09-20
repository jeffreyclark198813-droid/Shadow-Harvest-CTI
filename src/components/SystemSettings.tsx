import React, { useState, useEffect } from 'react';
import { UserSettings, saveUserSettings } from '../services/dbService';
import { auth } from '../firebase';
import { Shield, Key, Database, Server, Settings as SettingsIcon, AlertTriangle, Globe, EyeOff, Network, Sun, Moon, RefreshCw, Clock, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { DynamicAPIEndpointRegistry } from './DynamicAPIEndpointRegistry';
import { useTheme } from './ThemeProvider';

interface SystemSettingsProps {
  settings: UserSettings | null;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ settings }) => {
  const [role, setRole] = useState<'admin' | 'moderator' | 'user'>(settings?.role || 'admin');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(settings?.autoRefreshInterval ?? 30);
  const [saving, setSaving] = useState(false);
  const [savingPolling, setSavingPolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'rbac' | 'polling' | 'kafka' | 'integrations' | 'anonymity' | 'theme'>('rbac');
  const { theme, toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    if (settings) {
      if (settings.role) setRole(settings.role);
      if (settings.autoRefreshInterval !== undefined) setAutoRefreshInterval(settings.autoRefreshInterval);
    }
  }, [settings]);

  const handleSaveRole = async () => {
    if (!auth.currentUser || !settings) return;
    setSaving(true);
    try {
      await saveUserSettings(auth.currentUser.uid, {
        ...settings,
        role: role
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePollingInterval = async (interval: number) => {
    setAutoRefreshInterval(interval);
    if (!auth.currentUser || !settings) return;
    setSavingPolling(true);
    try {
      await saveUserSettings(auth.currentUser.uid, {
        ...settings,
        autoRefreshInterval: interval
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPolling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 border-b border-harvest-border">
        <button
          onClick={() => setActiveTab('rbac')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'rbac' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          Access & Roles
        </button>
        <button
          onClick={() => setActiveTab('polling')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'polling' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          Auto-Refresh & Polling
        </button>
        <button
          onClick={() => setActiveTab('kafka')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'kafka' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          Kafka Architecture
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'integrations' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          D.A.E.R. Layer
        </button>
        <button
          onClick={() => setActiveTab('anonymity')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'anonymity' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          Anonymity & OPSEC
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'theme' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          Theme & Appearance
        </button>
      </div>

      {activeTab === 'polling' && (
        <div className="hardware-surface p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mono-label flex items-center gap-2 text-white">
                <RefreshCw size={14} className={`text-harvest-accent ${savingPolling ? 'animate-spin' : ''}`}/>
                Automated Threat Intelligence Sync & Polling Interval
              </h3>
              <p className="text-[11px] font-mono text-gray-400 mt-1">
                Configure background polling cadence for active threat feeds, target updates, and OSINT correlations.
              </p>
            </div>
            <div className="px-3 py-1 bg-black/50 border border-harvest-border rounded-xl text-xs font-mono">
              <span className="text-gray-400">Current Cadence: </span>
              <span className="text-harvest-accent font-bold">
                {autoRefreshInterval === 0 ? 'Disabled (Manual Only)' : `${autoRefreshInterval}s Interval`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { interval: 0, label: 'Manual Only', tag: 'OFF', desc: 'No automatic background refetching. Refreshes only when requested by user.' },
              { interval: 10, label: '10 Seconds', tag: 'HIGH FREQUENCY', desc: 'Real-time tactical mode. Optimal for active monitoring and immediate telemetry ingestion.' },
              { interval: 30, label: '30 Seconds', tag: 'RECOMMENDED', desc: 'Balanced operational cadence. Prevents stale intelligence while preserving API quota.' },
              { interval: 60, label: '1 Minute', tag: 'STANDARD', desc: 'Standard background refresh interval suitable for long monitoring sessions.' },
              { interval: 120, label: '2 Minutes', tag: 'LIGHTWEIGHT', desc: 'Extended interval for background workspaces and secondary analysis screens.' },
              { interval: 300, label: '5 Minutes', tag: 'LOW BANDWIDTH', desc: 'Minimal network consumption. Periodic batch synchronization.' },
            ].map(item => {
              const isSelected = autoRefreshInterval === item.interval;
              return (
                <div
                  key={item.interval}
                  onClick={() => handleSavePollingInterval(item.interval)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                    isSelected
                      ? 'bg-harvest-accent/10 border-harvest-accent shadow-[0_0_15px_rgba(0,255,153,0.15)]'
                      : 'bg-black/50 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className={isSelected ? 'text-harvest-accent' : 'text-gray-500'} />
                      <span className={`text-xs font-bold font-mono uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {item.label}
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black ${
                      item.tag === 'RECOMMENDED' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : item.tag === 'HIGH FREQUENCY'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-white/5 text-gray-500'
                    }`}>
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono leading-relaxed mt-2">
                    {item.desc}
                  </p>
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-harvest-accent/20 flex items-center justify-between text-[9px] font-mono text-harvest-accent">
                      <span>CONFIGURATION ACTIVE</span>
                      <Check size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {activeTab === 'rbac' && (
        <div className="hardware-surface p-6 space-y-6">
          <h3 className="mono-label flex items-center gap-2 text-white">
            <Shield size={14} className="text-harvest-accent"/>
            Role-Based Access Control (RBAC)
          </h3>
          <p className="text-[11px] font-mono text-gray-400">
            Define local operator clearance and authorization levels for operational deployment.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'admin', label: 'Administrator', desc: 'Full access to system config, creation, architecture, and exports.' },
                { id: 'moderator', label: 'Moderator', desc: 'Can manage intelligence, run assessments, export data, and configure tracking.' },
                { id: 'user', label: 'User', desc: 'Read-only access to existing reports and dashboards. Cannot create targets or export.' }
              ].map(r => (
                <div 
                  key={r.id}
                  onClick={() => setRole(r.id as any)}
                  className={`p-4 rounded border cursor-pointer transition-colors ${role === r.id ? 'bg-harvest-accent/10 border-harvest-accent' : 'bg-black/50 border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${role === r.id ? 'text-white' : 'text-gray-400'}`}>{r.label}</span>
                    {role === r.id && <div className="w-2 h-2 rounded-full bg-harvest-accent shadow-[0_0_8px_rgba(0,255,153,0.8)]" />}
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSaveRole}
              disabled={saving || role === settings?.role}
              className="hardware-button px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              <Key size={14} />
              {saving ? 'UPDATING...' : (role === settings?.role ? 'ROLE ACTIVE' : 'APPLY ROLE')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'kafka' && (
        <div className="hardware-surface p-6 space-y-6">
          <h3 className="mono-label flex items-center gap-2 text-white">
            <Server size={14} className="text-[#ff00ff]"/>
            EOISP Deployment Blueprint
          </h3>
          <p className="text-[11px] font-mono text-gray-400">
            Reference architecture for Confluent Kafka + Schema Registry provisioning, Neo4j Real-time, and Monte Carlo.
          </p>

          <div className="prose prose-invert prose-xs font-mono max-w-none prose-headings:text-harvest-accent prose-a:text-[#00ffcc] prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
            <h4>1. High-Level Architecture</h4>
            <p><strong>Core Components:</strong> Kafka Cluster, Confluent Schema Registry, RBAC Identity Layer, Topic namespace: <code>addon.*</code>, Neo4j Real-time Graph Engine, Monte Carlo Data Observability.</p>
            <pre><code>{`Host Application
   ↓
Webhook / Log Export / CDC
   ↓
Kafka: addon.raw.events
   ↓
Feature Engine
   ↓
addon.features.derived
   ↓
Anomaly Model
   ↓
addon.anomaly.scores
   ↓
Graph (Neo4j) + Monte Carlo + Risk
   ↓
addon.incident.signals
   ↓
Dashboard / SIEM / Observability UI`}</code></pre>

            <h4>2. Kafka Cluster Provisioning (Terraform)</h4>
            <pre><code>{`resource "confluent_kafka_cluster" "observability" {
  display_name = "observability-sidecar-cluster"
  cloud        = "AWS"
  region       = "us-west-2"
  availability = "MULTI_ZONE"
  config {
    kind = "Basic"
  }
}`}</code></pre>

            <h4>3. Topics & Schema Registry</h4>
            <pre><code>{`resource "confluent_schema_registry_cluster" "sr" {
  package = "ESSENTIALS"
  region  = "us-west-2"
}

resource "confluent_kafka_topic" "raw_events" {
  topic_name    = "addon.raw.events"
  partitions_count = 24
  config = {
    "retention.ms" = "1209600000"
    "cleanup.policy" = "delete"
  }
}`}</code></pre>

            <h4>4. Neo4j & Monte Carlo Integaration</h4>
            <p>Topics such as <code>addon.graph.edges</code> connect via Kafka Connect Sink to <strong>Neo4j</strong> for real-time temporal graphing. Data quality and schema drifts across topic boundaries (e.g. <code>addon.features.derived</code>) are continuously monitored by <strong>Monte Carlo</strong> using its Kafka integration to detect upstream anomalies before they corrupt the threat assessment models.</p>

            <h4>5. Deployment Order</h4>
            <ol>
              <li>Provision Kafka cluster</li>
              <li>Provision Schema Registry & Monte Carlo</li>
              <li>Create service accounts</li>
              <li>Apply RBAC role bindings</li>
              <li>Create topics</li>
              <li>Register schemas</li>
              <li>Deploy stream processors (Kubernetes + Neo4j)</li>
              <li>Attach ingestion webhook/log connectors</li>
              <li>Enable dashboard consumer</li>
            </ol>
          </div>
        </div>
      )}
      {activeTab === 'integrations' && (
        <DynamicAPIEndpointRegistry />
      )}

      {activeTab === 'anonymity' && (
        <div className="hardware-surface p-6 space-y-6">
          <h3 className="mono-label flex items-center gap-2 text-white">
            <EyeOff size={14} className="text-[#00ffcc]"/>
            Anonymity & OPSEC Controls
          </h3>
          <p className="text-[11px] font-mono text-gray-400">
            Advanced operational security settings to mask traffic and device fingerprints.
          </p>

          <div className="space-y-6">
            <div className="p-4 rounded border bg-black/50 border-white/5 flex items-start justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">TOR Network Routing</h4>
                <p className="text-[10px] text-gray-500 font-mono mt-1 max-w-sm">Route all external telemetry, OSINT gathering, and threat feed polling through the TOR network proxy. Increases latency but masks origin IP.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00ffcc]"></div>
              </label>
            </div>

            <div className="p-4 rounded border bg-black/50 border-white/5 flex items-start justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Anti-Fingerprinting Engine</h4>
                <p className="text-[10px] text-gray-500 font-mono mt-1 max-w-sm">Counteract browser fingerprinting by randomizing canvas hash, WebGL vendors, audio contexts, and user-agent strings on outbound requests.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={false} />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00ffcc]"></div>
              </label>
            </div>
            
            <div className="p-4 rounded border bg-red-900/10 border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[10px] font-mono text-gray-400">
                  <span className="text-red-500 font-bold">WARNING:</span> Enabling TOR routing may trigger rate-limiting or captchas on certain target APIs. Ensure that strict proxy rotation is active if conducting automated OSINT scraping.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="hardware-surface p-6 space-y-6">
          <h3 className="mono-label flex items-center gap-2 text-white">
            <Sun size={14} className="text-harvest-accent"/>
            Theme & Appearance Settings
          </h3>
          <p className="text-[11px] font-mono text-gray-400">
            Customize the visual appearance and interface color scheme for operational visibility.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setTheme('dark')}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${theme === 'dark' ? 'bg-harvest-accent/10 border-harvest-accent shadow-[0_0_15px_rgba(0,255,0,0.15)]' : 'bg-black/50 border-white/5 hover:border-white/20'}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-black rounded-lg border border-white/10 text-harvest-accent">
                  <Moon size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Dark Mode (Default)</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">Optimized for low-light environments and tactical operations.</div>
                </div>
              </div>
              {theme === 'dark' && <div className="w-3 h-3 rounded-full bg-harvest-accent shadow-[0_0_8px_rgba(0,255,0,0.8)]" />}
            </div>

            <div 
              onClick={() => setTheme('light')}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${theme === 'light' ? 'bg-harvest-accent/10 border-harvest-accent shadow-[0_0_15px_rgba(0,255,0,0.15)]' : 'bg-black/50 border-white/5 hover:border-white/20'}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-yellow-400">
                  <Sun size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Light Mode</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">High contrast daylight visibility mode for well-lit environments.</div>
                </div>
              </div>
              {theme === 'light' && <div className="w-3 h-3 rounded-full bg-harvest-accent shadow-[0_0_8px_rgba(0,255,0,0.8)]" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
