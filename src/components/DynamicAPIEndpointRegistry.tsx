import React, { useState, useEffect } from 'react';
import { Database, Plus, CheckCircle2, AlertTriangle, Power, Trash2, Search, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { DAERService } from '../services/DAERService';
import { ApiEndpointConfig, EndpointStatus, EndpointProtocol } from '../types/federated';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';

export const DynamicAPIEndpointRegistry: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpointConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState<Partial<ApiEndpointConfig>>({
    endpoint_id: '',
    provider: '',
    uri: '',
    protocol: 'REST',
    authentication: { method: 'api_key' },
    enabled: true,
    status: 'CONFIGURED',
    capabilities: ['SEARCH_PUBLIC']
  });

  useEffect(() => {
    return DAERService.subscribeToEndpoints(setEndpoints);
  }, []);

  const handleAddEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await DAERService.registerEndpoint({
        ...newEndpoint,
        createdBy: user.uid
      } as ApiEndpointConfig);
      setShowAddForm(false);
      setNewEndpoint({ protocol: 'REST', authentication: { method: 'api_key' }, enabled: true, status: 'CONFIGURED' });
    } catch (err) {
      console.error('Failed to register endpoint:', err);
    }
  };

  const toggleEndpoint = async (id: string, enabled: boolean) => {
    await DAERService.updateEndpoint(id, { enabled });
  };

  const getStatusColor = (status: EndpointStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400';
      case 'DEGRADED': return 'text-yellow-400';
      case 'DISABLED': return 'text-gray-500';
      case 'REVOKED': return 'text-red-500';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-harvest-accent/10 rounded-lg">
            <Database className="text-harvest-accent" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">API Control Plane</h3>
            <p className="text-[10px] text-gray-500 font-mono">DAER // FEDERATED ENDPOINT REGISTRY</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="hardware-button-primary !py-2 !px-4 !text-[10px] flex items-center gap-2"
        >
          <Plus size={14} />
          REGISTER ENDPOINT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {endpoints.map(endpoint => (
            <motion.div 
              key={endpoint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-harvest-card border border-harvest-border rounded-2xl p-5 space-y-4 hover:border-harvest-accent/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono uppercase">{endpoint.provider}</span>
                    <span className={`text-[8px] font-bold uppercase ${getStatusColor(endpoint.status)}`}>{endpoint.status}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-mono truncate max-w-[150px]">{endpoint.uri}</p>
                </div>
                <button 
                  onClick={() => toggleEndpoint(endpoint.id!, !endpoint.enabled)}
                  className={`p-1.5 rounded-lg transition-colors ${endpoint.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                >
                  <Power size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
                <span>{endpoint.protocol}</span>
                <span aria-hidden="true" className="text-gray-700">·</span>
                <span className="lowercase">auth: {(endpoint.authentication && endpoint.authentication.method) || 'none'}</span>
              </div>

              <div className="pt-4 border-t border-harvest-border/50 flex items-center justify-between">
                <div className="flex gap-1">
                  {(endpoint.capabilities || []).map(cap => (
                    <div key={cap} className="w-1.5 h-1.5 rounded-full bg-harvest-accent" title={cap} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={12} className="text-gray-600" />
                  <span className="text-[8px] text-gray-600 font-mono italic">POLICY ENFORCED</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleAddEndpoint}
            className="bg-harvest-card border border-harvest-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8 space-y-6"
          >
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Register Federated Provider</h4>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Provider Identifier</label>
                <input 
                  type="text" 
                  value={newEndpoint.provider}
                  onChange={e => setNewEndpoint({...newEndpoint, provider: e.target.value})}
                  className="w-full bg-black/40 border border-harvest-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-harvest-accent transition-colors"
                  placeholder="e.g. VirusTotal"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Endpoint URI</label>
                <input 
                  type="text" 
                  value={newEndpoint.uri}
                  onChange={e => setNewEndpoint({...newEndpoint, uri: e.target.value})}
                  className="w-full bg-black/40 border border-harvest-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-harvest-accent transition-colors"
                  placeholder="https://api.vt.gov/v3"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Protocol</label>
                  <select 
                    value={newEndpoint.protocol}
                    onChange={e => setNewEndpoint({...newEndpoint, protocol: e.target.value as EndpointProtocol})}
                    className="w-full bg-black/40 border border-harvest-border rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="REST">REST</option>
                    <option value="GRAPHQL">GraphQL</option>
                    <option value="STREAM">Stream</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Auth Method</label>
                  <select 
                    value={(newEndpoint.authentication && newEndpoint.authentication.method) || 'none'}
                    onChange={e => setNewEndpoint({...newEndpoint, authentication: { method: e.target.value as any }})}
                    className="w-full bg-black/40 border border-harvest-border rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="api_key">API Key</option>
                    <option value="OAuth2">OAuth2</option>
                    <option value="mTLS">mTLS</option>
                    <option value="none">Open / Public</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 border border-harvest-border rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-harvest-accent text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
              >
                SAVE REGISTRATION
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
};
