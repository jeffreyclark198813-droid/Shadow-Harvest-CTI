import React from 'react';
import { Shield, Lock, Eye, Terminal, Activity, Database, Scale, Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';

export const SystemGovernanceOverview: React.FC = () => {
  const controls = [
    { icon: Terminal, label: 'Authentication', status: 'Enforced', desc: 'OAuth2 / OIDC Identity Verification' },
    { icon: Scale, label: 'Explicit Authorization', status: 'Policy-Based', desc: 'IAMLaw Namespace Controls' },
    { icon: Eye, label: 'Immutable Audit', status: 'Active', desc: 'Tamper-Evident Operation Logging' },
    { icon: Lock, label: 'Least Privilege', status: 'Fail-Closed', desc: 'Zero-Trust Resource Access' },
    { icon: Database, label: 'Data Integrity', status: 'Verified', desc: 'Cryptographic Provenance (T0-T2)' },
    { icon: Fingerprint, label: 'Credential Isolation', status: 'Server-Side', desc: 'Secure Secret Management' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-harvest-accent/10 rounded-lg">
          <Shield className="text-harvest-accent" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Governance (IAMGod)</h3>
          <p className="text-[10px] text-gray-500 font-mono">INTERNAL CONTROL SUBSYSTEM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {controls.map((control, idx) => (
          <motion.div 
            key={control.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-harvest-card border border-harvest-border rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-black/40 rounded-lg">
                <control.icon size={14} className="text-harvest-accent" />
              </div>
              <span className="text-[8px] font-bold text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                {control.status}
              </span>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase">{control.label}</h4>
              <p className="text-[9px] text-gray-500 font-mono mt-1">{control.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-5 bg-black/40 border border-harvest-border rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-harvest-accent" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Mandatory Governance Invariant</span>
        </div>
        <p className="text-[9px] text-gray-400 leading-relaxed font-mono italic">
          SYMBOLIC INTERNAL CONTROL ONLY; NEVER DIVINE, SOVEREIGN, LEGAL, OR SUPERNATURAL AUTHORITY; NEVER A SECURITY BYPASS. 
          REGISTRY MEMBERSHIP NEVER GRANTS CAPABILITY. ALL ACTIONS ARE SUBJECT TO NORMAL SECURITY CONTROLS.
        </p>
      </div>
    </div>
  );
};
