import React, { useState } from 'react';
import { Search, Loader2, Globe, Shield, ArrowRight, ShieldCheck, Database, Zap, FileText, Info } from 'lucide-react';
import { FederatedSearchService } from '../services/FederatedSearchService';
import { FederatedSearchResult, EvidenceState } from '../types/federated';
import { motion, AnimatePresence } from 'motion/react';

export const FederatedSearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FederatedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await FederatedSearchService.executeQuery(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEvidenceDotColor = (state: EvidenceState) => {
    switch (state) {
      case 'OBSERVED': return 'bg-emerald-400 shadow-[0_0_8px_#10b981]';
      case 'VERIFIED': return 'bg-blue-400 shadow-[0_0_8px_#3b82f6]';
      case 'DERIVED': return 'bg-purple-400 shadow-[0_0_8px_#a855f7]';
      case 'INFERRED': return 'bg-yellow-400 shadow-[0_0_8px_#eab308]';
      default: return 'bg-gray-400';
    }
  };

  const getEvidenceTextColor = (state: EvidenceState) => {
    switch (state) {
      case 'OBSERVED': return 'text-emerald-400';
      case 'VERIFIED': return 'text-blue-400';
      case 'DERIVED': return 'text-purple-400';
      case 'INFERRED': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-harvest-accent/10 border border-harvest-accent/30 rounded-full">
          <Zap size={12} className="text-harvest-accent" />
          <span className="text-[9px] font-bold text-harvest-accent uppercase tracking-widest">Federated Intelligence Pipeline</span>
        </div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">OSINT Control Plane Search</h2>
        <p className="text-xs text-gray-500 font-mono">Execute provider-neutral queries across the Shadow Harvest mesh.</p>
        
        <form onSubmit={handleSearch} className="relative mt-8 group">
          <div className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-focus-within:text-harvest-accent transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Query domain, IP, or persona identifier..."
            className="w-full bg-harvest-card/50 border border-harvest-border rounded-2xl py-4 pl-12 pr-32 text-sm text-white placeholder-gray-600 outline-none focus:border-harvest-accent focus:ring-4 focus:ring-harvest-accent/5 transition-all font-mono"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-harvest-accent text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'EXECUTE'}
          </button>
        </form>
      </div>

      <div className="space-y-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-mono"
            >
              <Shield className="shrink-0" size={16} />
              {error}
            </motion.div>
          )}

          {results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{results.length} EVIDENCE ARTIFACTS RESOLVED</span>
                <span className="text-[10px] font-mono text-gray-600">CORRELATION_ID: {results[0].query_id.slice(0, 8)}</span>
              </div>

              {results.map((result, idx) => (
                <motion.div 
                  key={result.result_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-harvest-card border border-harvest-border rounded-2xl overflow-hidden hover:border-harvest-accent/20 transition-all"
                >
                  <div className="px-6 py-4 border-b border-harvest-border flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-black/40 rounded-lg">
                        <Database size={14} className="text-harvest-accent" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white uppercase">{result.source}</h4>
                        <p className="text-[9px] text-gray-600 font-mono lowercase">ID: {result.result_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-black/30 rounded-lg border border-harvest-border/40">
                      <span className={`w-1.5 h-1.5 rounded-full ${getEvidenceDotColor(result.evidence_state)}`} />
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${getEvidenceTextColor(result.evidence_state)}`}>
                        {result.evidence_state}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Retrieved Content</span>
                        <div className="p-4 bg-black/30 border border-harvest-border/50 rounded-xl">
                          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{JSON.stringify(result.content, null, 2)}</pre>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={12} className="text-harvest-accent" />
                          <span className="text-[9px] text-gray-400 font-mono uppercase italic">{result.authorization_state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-blue-400" />
                          <span className="text-[9px] text-gray-400 font-mono uppercase italic">{result.verification_state}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-l border-harvest-border/30 pl-6">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Provenance</span>
                        <div className="text-[10px] text-gray-400 font-mono break-all bg-black/20 p-2 rounded">
                          {result.provenance.source}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Confidence Matrix</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-harvest-accent" style={{ width: `${result.confidence * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-harvest-accent">{(result.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Restrictions</span>
                        <div className="flex flex-wrap gap-1">
                          {result.restrictions.map(res => (
                            <span key={res} className="px-1.5 py-0.5 bg-red-950/30 text-red-400 border border-red-900/30 rounded text-[7px] font-bold">{res}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && results.length === 0 && !error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center opacity-40"
            >
              <Globe size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Execute query to resolve federated artifacts</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
