import React, { useState, useEffect } from 'react';
import { UserSettings, saveUserSettings } from '../services/dbService';
import { auth } from '../firebase';
import { Shield, Key, Database, Server, Settings as SettingsIcon, AlertTriangle, Globe, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemSettingsProps {
  settings: UserSettings | null;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ settings }) => {
  const [role, setRole] = useState<'admin' | 'moderator' | 'user'>(settings?.role || 'admin');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'rbac' | 'kafka' | 'integrations' | 'anonymity'>('rbac');

  const handleSaveRole = async () => {
    if (!auth.currentUser || !settings) return;
    setSaving(true);
    try {
      await saveUserSettings(auth.currentUser.uid, {
        ...settings,
        role: role
      });
      // In a real app we might reload or state will update
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-harvest-border">
        <button
          onClick={() => setActiveTab('rbac')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'rbac' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          Access & Roles
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
          Threat Feeds (API)
        </button>
        <button
          onClick={() => setActiveTab('anonymity')}
          className={`pb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'anonymity' ? 'border-b-2 border-harvest-accent text-white' : 'text-gray-500'}`}
        >
          Anonymity & OPSEC
        </button>
      </div>

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
        <div className="hardware-surface p-6 space-y-6">
          <h3 className="mono-label flex items-center gap-2 text-white">
            <Globe size={14} className="text-harvest-info"/>
            External Intelligence Integrations
          </h3>
          <p className="text-[11px] font-mono text-gray-400">
            Configure external threat intelligence feeds to automatically enrich targets and profiles.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 rounded border bg-black/50 border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">AlienVault OTX</h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">Open Threat Exchange pulses and indicators of compromise.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-[9px] font-mono text-gray-500">OFFLINE</span>
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-mono text-gray-400 uppercase">API Key</label>
                 <input type="password" placeholder="Enter OTX Key..." className="w-full bg-harvest-bg border border-harvest-border rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none" />
              </div>
              <button className="text-[10px] uppercase font-bold text-harvest-accent hover:text-white transition-colors">Test Connection</button>
            </div>

            <div className="p-4 rounded border bg-black/50 border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">MISP Threat Sharing</h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">Malware Information Sharing Platform instance connection.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-[9px] font-mono text-gray-500">OFFLINE</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-400 uppercase">Instance URL</label>
                  <input type="text" placeholder="https://misp.local" className="w-full bg-harvest-bg border border-harvest-border rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-400 uppercase">API Key</label>
                  <input type="password" placeholder="Enter MISP Auth Key..." className="w-full bg-harvest-bg border border-harvest-border rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none" />
                </div>
              </div>
              <button className="text-[10px] uppercase font-bold text-harvest-accent hover:text-white transition-colors">Test Connection</button>       
            </div>
          </div>
        </div>
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
    </div>
  );
};
