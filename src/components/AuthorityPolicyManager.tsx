import React, { useState, useEffect } from 'react';
import { Shield, UserCheck, AlertOctagon, Scale, Fingerprint, Search, Info, Clock, BadgeCheck } from 'lucide-react';
import { FederatedSearchService } from '../services/FederatedSearchService';
import { DAERService } from '../services/DAERService';
import { AuthorityPolicy, RegistryIdentifier, AuthorizationStatus } from '../types/federated';
import { motion, AnimatePresence } from 'motion/react';

export const AuthorityPolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<AuthorityPolicy[]>([]);
  const [identifiers, setIdentifiers] = useState<RegistryIdentifier[]>([]);
  const [activeTab, setActiveTab] = useState<'policies' | 'registry'>('policies');

  useEffect(() => {
    const unsubPolicies = FederatedSearchService.subscribeToPolicies(setPolicies);
    const unsubRegistry = DAERService.subscribeToRegistry(setIdentifiers);
    return () => {
      unsubPolicies();
      unsubRegistry();
    };
  }, []);

  const getAuthStatusStyle = (status: AuthorizationStatus) => {
    switch (status) {
      case 'AUTHORIZED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DENIED': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'PENDING_VERIFICATION': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-harvest-accent/10 rounded-lg">
            <Scale className="text-harvest-accent" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Authority & Governance</h3>
            <p className="text-[10px] text-gray-500 font-mono">IAMLAW // APPLICATION AUTHORIZATION POLICY</p>
          </div>
        </div>

        <div className="flex bg-black/40 border border-harvest-border rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'policies' ? 'bg-harvest-accent text-black' : 'text-gray-500 hover:text-white'}`}
          >
            POLICIES
          </button>
          <button 
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'registry' ? 'bg-harvest-accent text-black' : 'text-gray-500 hover:text-white'}`}
          >
            IDENTIFIER REGISTRY
          </button>
        </div>
      </div>

      {activeTab === 'policies' ? (
        <div className="space-y-4">
          {policies.length === 0 ? (
            <div className="p-12 text-center bg-black/20 rounded-3xl border border-dashed border-harvest-border">
              <Shield className="mx-auto text-gray-700 mb-4" size={40} />
              <p className="text-xs text-gray-500 font-mono italic uppercase tracking-widest">No active authorization policies detected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {policies.map(policy => (
                <div key={policy.id} className="bg-harvest-card border border-harvest-border rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-black/40 rounded-lg">
                      <Shield size={16} className="text-harvest-accent" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{policy.principal}</span>
                        <BadgeCheck size={12} className="text-blue-400" />
                      </div>
                      <p className="text-[9px] text-gray-500 font-mono lowercase">action: {policy.requested_action} // res: {policy.requested_resource}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center justify-end gap-1 text-[8px] text-gray-600 font-mono uppercase">
                        <Clock size={10} />
                        Expires: {policy.expires_at?.toDate().toLocaleDateString()}
                      </div>
                      <p className="text-[8px] text-gray-600 font-mono">AUDIT: {policy.audit_id?.slice(0,8)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-[9px] font-bold uppercase ${getAuthStatusStyle(policy.authorization_status)}`}>
                      {policy.authorization_status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {identifiers.map(id => (
            <div key={id.id} className="bg-harvest-card border border-harvest-border rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Fingerprint size={14} className="text-harvest-accent" />
                    <span className="text-xs font-bold text-white font-mono truncate max-w-[150px]">{id.identifier}</span>
                  </div>
                  <span className="text-[8px] text-gray-600 font-mono uppercase">{id.classification}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-harvest-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${id.state.includes('UNVERIFIED') ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{id.state.replace(/_/g, ' ')}</span>
                  </div>
                  <Info size={12} className="text-gray-700 cursor-help" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-yellow-950/10 border border-yellow-900/20 rounded-2xl flex items-start gap-3">
        <AlertOctagon size={16} className="text-yellow-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Jurisdiction Caveat</p>
          <p className="text-[9px] text-yellow-700/80 leading-relaxed italic">
            SYMBOLIC INTERNAL CONTROL ONLY; NEVER DIVINE, SOVEREIGN, LEGAL, OR SUPERNATURAL AUTHORITY; NEVER A SECURITY BYPASS. NO INFERENCE OF REAL-WORLD LEGAL AUTHORITY.
          </p>
        </div>
      </div>
    </div>
  );
};
