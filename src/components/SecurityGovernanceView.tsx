import React, { useState, useEffect } from 'react';
import { Shield, GitBranch, ShieldAlert, History, Activity, Fingerprint, Lock, Search, Filter } from 'lucide-react';
import { ProvenanceVisualizer } from './ProvenanceVisualizer';
import { QuarantineManager } from './QuarantineManager';
import { db, collection, query, orderBy, limit, onSnapshot } from '../firebase';
import { AuditLogEntry } from '../types/intelligence_ops';
import { motion, AnimatePresence } from 'motion/react';

export const SecurityGovernanceView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'provenance' | 'quarantine'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('');
  const [artifactSearch, setArtifactSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-harvest-card border border-harvest-border rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-harvest-accent/10 rounded-2xl border border-harvest-accent/20">
            <Shield className="text-harvest-accent" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Security & Governance</h2>
            <p className="text-xs text-gray-500 font-mono">UIF-OS PROTOCOL COMPLIANCE DASHBOARD</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-harvest-border">
          {[
            { id: 'audit', icon: History, label: 'Audit Logs' },
            { id: 'provenance', icon: GitBranch, label: 'Provenance' },
            { id: 'quarantine', icon: ShieldAlert, label: 'Quarantine' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-harvest-accent text-black shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} />
              <span className="uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-harvest-accent" />
                Security Event Stream (Section 32)
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-black/30 px-3 py-1 rounded-full border border-harvest-border">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                REAL-TIME MONITORING ACTIVE
              </div>
            </div>

            <div className="bg-harvest-card border border-harvest-border rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-harvest-border">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actor</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Action</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Result</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Redacted Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-harvest-border/50">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[10px] font-mono text-gray-400">
                            {log.timestamp?.toDate().toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-harvest-accent/10 flex items-center justify-center border border-harvest-accent/30">
                              <Lock size={10} className="text-harvest-accent" />
                            </div>
                            <span className="text-[10px] font-mono text-gray-300">{log.userId.slice(0, 8)}...</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-white bg-white/5 px-2 py-1 rounded border border-white/10 uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase ${
                            log.result === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${log.result === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {log.result}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-[10px] text-gray-400 font-mono truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                            {log.details}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {auditLogs.length === 0 && !loading && (
                <div className="py-20 text-center">
                  <Fingerprint size={48} className="mx-auto text-harvest-accent/20 mb-4" />
                  <p className="text-sm text-gray-500 font-mono italic">No security events recorded in this epoch.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'provenance' && (
          <motion.div
            key="provenance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <GitBranch size={16} className="text-harvest-accent" />
                Lineage Resolution (Section 55)
              </h3>
              
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input
                  type="text"
                  value={artifactSearch}
                  onChange={(e) => setArtifactSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedArtifactId(artifactSearch)}
                  placeholder="Enter Artifact ID (e.g. report-42)..."
                  className="w-full pl-9 pr-20 py-2 bg-black/40 border border-harvest-border rounded-xl text-xs text-gray-200 focus:outline-none focus:border-harvest-accent font-mono transition-colors"
                />
                <button
                  onClick={() => setSelectedArtifactId(artifactSearch)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-harvest-accent text-black rounded-lg text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Resolve
                </button>
              </div>
            </div>

            {selectedArtifactId ? (
              <div className="bg-harvest-card border border-harvest-border rounded-3xl p-8 shadow-2xl">
                <ProvenanceVisualizer artifactId={selectedArtifactId} />
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center bg-black/20 rounded-3xl border border-dashed border-harvest-border opacity-60">
                <div className="p-4 bg-harvest-accent/5 rounded-full mb-4">
                  <Search size={48} className="text-harvest-accent/30" />
                </div>
                <p className="text-xs text-gray-500 font-mono text-center uppercase tracking-widest max-w-xs leading-relaxed">
                  Enter an artifact identifier above to perform a deep cryptographic lineage resolution.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'quarantine' && (
          <motion.div
            key="quarantine"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <QuarantineManager />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
