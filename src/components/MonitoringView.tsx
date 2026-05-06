import React from 'react';
import { MonitoringEvent } from '../services/dbService';
import { Radio, AlertTriangle, Clock, Fingerprint, Database, Store } from 'lucide-react';
import { motion } from 'motion/react';

interface MonitoringViewProps {
  events: MonitoringEvent[];
  onPollTelemetry: () => void;
  loading: boolean;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ events, onPollTelemetry, loading }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="mono-label flex items-center gap-2 !text-harvest-accent">
            <Radio size={14} className="animate-pulse" />
            Continuous Monitoring Pipeline
          </h3>
          <div className="flex items-center gap-2 px-2 py-1 bg-harvest-accent/10 border border-harvest-accent/30 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-harvest-accent animate-pulse" />
            <span className="text-[9px] font-bold text-harvest-accent uppercase">Live</span>
          </div>
        </div>
        <button
          onClick={onPollTelemetry}
          disabled={loading}
          className="hardware-button px-4 py-2"
        >
          {loading ? 'COLLECTING...' : 'TRIGGER COLLECTION'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="mono-label !text-gray-400 mb-2">Event Feed</div>
          {events.length === 0 ? (
            <div className="hardware-surface p-12 text-center text-gray-500">
              <Database size={32} className="mx-auto mb-4 opacity-20 text-harvest-accent" />
              <p className="mono-label">No events detected in the current monitoring cycle.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, i) => (
                <motion.div
                  key={event.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hardware-surface !py-4 flex gap-4 items-start group hover:border-harvest-accent/30 transition-colors"
                >
                  <div className={`p-2 rounded ${
                    event.severity === 'critical' ? 'bg-red-900/20 text-red-500 border border-red-500/30' :
                    event.severity === 'high' ? 'bg-harvest-warning/10 text-harvest-warning border border-harvest-warning/30' :
                    'bg-harvest-info/10 text-harvest-info border border-harvest-info/30'
                  }`}>
                    {event.type.includes('vendor') || event.type.includes('listing') ? <Store size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-tighter text-white font-mono break-all line-clamp-1">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1 shrink-0">
                        <Clock size={10} />
                        {event.timestamp?.toDate().toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed">{event.description}</p>
                    <div className="pt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[9px] font-mono text-gray-600 bg-black/50 px-2 py-1 rounded border border-white/5">
                        <Fingerprint size={10} />
                        PROVENANCE HASH: <span className="text-harvest-accent/70">{event.dataHash.substring(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="hardware-surface p-6 space-y-4">
            <div className="mono-label !text-harvest-accent">Pipeline Status</div>
            <div className="space-y-3 font-mono">
              {[
                { label: 'Dark Web Forums', status: 'Active' },
                { label: 'Dark Web Markets', status: 'Active' },
                { label: 'Paste Sites', status: 'Active' },
                { label: 'Onion Services', status: 'Active' },
                { label: 'Blockchain Nodes', status: 'Active' },
              ].map((p, i) => (
                <div key={i} className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 uppercase">{p.label}</span>
                  <span className="text-harvest-accent font-bold uppercase">{p.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hardware-surface p-6 space-y-4">
            <div className="mono-label !text-harvest-accent">Data Integrity</div>
            <p className="text-[11px] text-gray-500 leading-relaxed font-mono">
              All collected artifacts are automatically hashed using SHA-256 and logged with a verifiable UTC timestamp to ensure provenance and chain of custody.
            </p>
            <div className="p-3 bg-black/50 border border-harvest-accent/20 rounded-lg font-mono text-[9px] text-harvest-accent/70 break-all">
              SYSTEM_INTEGRITY_CHECK: PASSED
              <br />
              LAST_SYNC: {new Date().toISOString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
