import React, { useState, useEffect } from 'react';
import { ApiEndpointConfig, createApiEndpoint, updateApiEndpoint, deleteApiEndpoint, subscribeToApiEndpoints } from '../services/dbService';
import { auth } from '../firebase';
import { Network, Plus, Settings2, Trash2, Power, Edit3, Save, X, Activity, Server, Key, Box, RefreshCw } from 'lucide-react';

export const DynamicAPIEndpointRegistry: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpointConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ApiEndpointConfig>>({
    name: '',
    type: 'rest',
    base_url: '',
    auth_method: 'api_key',
    classification_tag: 'OSINT',
    enabled: true,
    refresh_interval_ms: 60000,
    data_lineage_required: true,
    status: 'REGISTERED'
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = subscribeToApiEndpoints(auth.currentUser.uid, setEndpoints);
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    if (editingId) {
      await updateApiEndpoint(editingId, formData);
      setEditingId(null);
    } else {
      await createApiEndpoint({
        ...(formData as Omit<ApiEndpointConfig, 'id' | 'createdAt' | 'updatedAt'>),
        createdBy: auth.currentUser.uid
      });
      setIsAdding(false);
    }
  };

  const startEdit = (ep: ApiEndpointConfig) => {
    setFormData(ep);
    setEditingId(ep.id!);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      name: '', type: 'rest', base_url: '',
      auth_method: 'api_key', classification_tag: 'OSINT',
      enabled: true, refresh_interval_ms: 60000,
      data_lineage_required: true, status: 'REGISTERED'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="mono-label flex items-center gap-2 text-white">
          <Network size={14} className="text-harvest-accent" />
          Dynamic API Endpoint Registry (DAER)
        </h3>
        
        {!isAdding && !editingId && (
          <button 
            onClick={() => { setIsAdding(true); setFormData({ name: '', type: 'rest', base_url: '', auth_method: 'api_key', classification_tag: 'OSINT', enabled: true, refresh_interval_ms: 60000, data_lineage_required: true, status: 'REGISTERED' }); }}
            className="hardware-button px-4 py-1.5 flex items-center gap-2 text-[10px]"
          >
            <Plus size={12} />
            REGISTER ENDPOINT
          </button>
        )}
      </div>

      <p className="text-[11px] font-mono text-gray-400">
        Declarative control plane for federated intelligence. All data sources are hot-pluggable ingestion nodes dynamically provisioned via settings.
      </p>

      {(isAdding || editingId) && (
        <div className="hardware-surface p-4 border border-harvest-accent/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Endpoint Name</label>
              <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none" placeholder="e.g. Shodan Streaming API" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Base URL</label>
              <input type="text" value={formData.base_url || ''} onChange={(e) => setFormData({...formData, base_url: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none" placeholder="https://api.shodan.io/shodan/ports" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none">
                <option value="rest">REST API</option>
                <option value="websocket">WebSocket Stream</option>
                <option value="grpc">gRPC</option>
                <option value="webhook">Webhook Listener</option>
                <option value="batch">Batch / ETL</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Auth Method</label>
              <select value={formData.auth_method} onChange={(e) => setFormData({...formData, auth_method: e.target.value as any})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none">
                <option value="api_key">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
                <option value="mTLS">Mutual TLS (mTLS)</option>
                <option value="signed_request">Signed Request</option>
                <option value="none">No Auth (Public)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Classification</label>
              <select value={formData.classification_tag} onChange={(e) => setFormData({...formData, classification_tag: e.target.value as any})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none">
                <option value="OSINT">OSINT</option>
                <option value="SOC">SOC Events</option>
                <option value="GOV">Gov Data</option>
                <option value="MIL">Military Intel</option>
                <option value="PRIVATE">Private Feeds</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Refresh Interval (ms)</label>
              <input type="number" value={formData.refresh_interval_ms || 60000} onChange={(e) => setFormData({...formData, refresh_interval_ms: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-white focus:border-harvest-accent outline-none" />
            </div>

            <div className="col-span-full flex items-center gap-6 mt-2">
               <label className="flex items-center gap-2 text-[11px] font-mono text-gray-300">
                 <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData({...formData, enabled: e.target.checked})} />
                 Enabled (Active Ingestion)
               </label>
               <label className="flex items-center gap-2 text-[11px] font-mono text-gray-300">
                 <input type="checkbox" checked={formData.data_lineage_required} onChange={(e) => setFormData({...formData, data_lineage_required: e.target.checked})} />
                 Enforce Data Lineage (Provenance)
               </label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
             <button onClick={cancelEdit} className="hardware-button px-4 py-1.5 flex items-center gap-2 text-[10px]">
               <X size={12} /> CANCEL
             </button>
             <button onClick={handleSave} className="hardware-button-primary px-4 py-1.5 flex items-center gap-2 text-[10px]">
               <Save size={12} /> SAVE CONFIG
             </button>
          </div>
        </div>
      )}

      {/* Nodes List */}
      <div className="space-y-3">
         {endpoints.map(ep => (
           <div key={ep.id} className="hardware-surface p-0 flex flex-col md:flex-row overflow-hidden border border-white/5 group">
             
             {/* Status indicator rail */}
             <div className={`w-1 shrink-0 ${ep.enabled ? (ep.status === 'ACTIVE' ? 'bg-[#00ffcc]' : 'bg-[#00ffcc]/30') : 'bg-red-500'}`} />
             
             <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">{ep.name}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border ${ep.type === 'websocket' ? 'border-[#ff00ff] text-[#ff00ff]' : 'border-harvest-accent text-harvest-accent'}`}>
                      {ep.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                     <Server size={10} />
                     <span className="text-[10px] font-mono truncate">{ep.base_url}</span>
                  </div>
                </div>

                <div className="space-y-2 col-span-1">
                   <div className="flex items-center gap-2">
                      <Box size={10} className="text-gray-400" />
                      <span className="text-[9px] font-mono text-gray-400 uppercase">Kafka Topic</span>
                   </div>
                   <div className="text-[10px] bg-black/50 px-2 py-1 rounded inline-block font-mono border border-white/5">
                     {ep.classification_tag.toLowerCase()}.{ep.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.stream
                   </div>
                </div>

                <div className="col-span-1 flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-gray-400 uppercase mb-1">State</div>
                    <div className={`text-[10px] font-bold ${ep.enabled ? 'text-[#00ffcc]' : 'text-red-500'}`}>
                      {ep.enabled ? ep.status || 'ACTIVE' : 'DISABLED'}
                    </div>
                  </div>
                  
                  <div className="flex rounded border border-white/5 bg-black/50 overflow-hidden">
                    <button onClick={() => updateApiEndpoint(ep.id!, { enabled: !ep.enabled, status: !ep.enabled ? 'ACTIVE' : 'DISABLED' })} className="p-2 hover:bg-white/10 text-gray-400" title="Toggle Power">
                      <Power size={14} className={ep.enabled ? 'text-[#00ffcc]' : ''} />
                    </button>
                    <button onClick={() => startEdit(ep)} className="p-2 hover:bg-white/10 text-gray-400" title="Configure">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteApiEndpoint(ep.id!)} className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400" title="Retire Node">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

             </div>
           </div>
         ))}
         
         {endpoints.length === 0 && !isAdding && (
           <div className="text-center py-12 border border-dashed border-white/10 rounded">
             <Activity size={24} className="mx-auto text-gray-500 mb-2 opacity-50" />
             <p className="text-[11px] font-mono text-gray-500 uppercase">No Data Sources Configured</p>
           </div>
         )}
      </div>

    </div>
  );
};
