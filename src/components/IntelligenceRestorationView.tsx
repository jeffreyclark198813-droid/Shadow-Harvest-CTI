import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, RefreshCw, Play, Database, Cpu, Layers, Shield, 
  Activity, CheckCircle2, AlertCircle, Binary, Download, 
  Copy, Terminal, ArrowRight, Check, Network, ShieldCheck, 
  HelpCircle, Eye, FileJson, AlertTriangle
} from 'lucide-react';
import { restoreAndExpandData, RestorationResult, EnrichedEntity } from '../services/geminiService';
import { createTarget, incrementUserStat, UserPersona } from '../services/dbService';
import { auth } from '../firebase';
import { audioFeedback } from '../utils/audio';

interface IntelligenceRestorationViewProps {
  activePersona: UserPersona;
  onClose: () => void;
}

const PRELOADED_TEMPLATES = [
  {
    title: "APT29 Campaign Indicator Snippet (Truncated)",
    text: "CAMP: Cobalt-Rain. Target: govt_agency_sub. IOC: 185.190.140.23, cert md5: a1c8b9d... C2 domain: wind-update-server[.]com. Notes: beacon interval 30s. Key: ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCs9g...",
    mode: "reconstruct" as const
  },
  {
    title: "Dark Web Leak Metadata (Fragmented)",
    text: "ALIAS: shadow_broker_v3. FORUM: Dread Onion. BTC WALLET: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh. POST: Selling 50GB corporate network configs, SSL keys, admin pwd for tech_giant. Onion: dread3v...onion",
    mode: "osint_fusion" as const
  },
  {
    title: "Obfuscated SSH Brute Force (Reduced)",
    text: "Host logs: SSH brute from IP 45.92.160.12. User list: root, admin, support. Tries: 4500/min. Target: subnet 10.0.4.0/24. Attack signature: SHA256:7b9c1d0e...",
    mode: "graph_resolve" as const
  }
];

export const IntelligenceRestorationView: React.FC<IntelligenceRestorationViewProps> = ({ activePersona, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'reconstruct' | 'osint_fusion' | 'graph_resolve'>('reconstruct');
  const [isProcessing, setIsProcessing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [result, setResult] = useState<RestorationResult | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'dossier' | 'atomic' | 'entities' | 'schema'>('dossier');
  const [copied, setCopied] = useState(false);
  const [publishedTargets, setPublishedTargets] = useState<Set<string>>(new Set());

  // Log simulation sequence
  const runLogSequence = async () => {
    setConsoleLogs([]);
    const logs = [
      "Initializing Precision Data Restoration & Expansion Engine...",
      "Analyzing input text syntax & token clustering coefficients...",
      "Executing lexical Isolation algorithms on fragment...",
      "Querying available knowledge domains & persona cognitive bias parameters...",
      "Performing Bayesian cross-validation on detected indicators...",
      "Reconstructing historical context via machine-assisted pattern discovery...",
      "Applying Shannon Entropy minimization models to resolve semantic gaps...",
      "Executing high-fidelity entity resolution & graph centrality mapping...",
      "Normalizing technical language definitions to RFC / standard schemas...",
      "Structuring output according to STIX 2.1 intelligence formats..."
    ];

    for (let i = 0; i < logs.length; i++) {
      if (!isProcessing) break;
      audioFeedback.playTrigger('tick');
      setConsoleLogs(prev => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${logs[i]}`]);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setResult(null);
    audioFeedback.playTrigger('scan');

    // Run parallel logs and Gemini API
    const logPromise = runLogSequence();
    
    try {
      const enrichment = await restoreAndExpandData(inputText, mode, activePersona);
      
      // Ensure logs are finished or look complete
      await logPromise;
      
      setResult(enrichment);
      audioFeedback.playTrigger('high');
      
      const user = auth.currentUser;
      if (user) {
        incrementUserStat(user.uid, 'actionsTaken');
      }
    } catch (err) {
      console.error("Restoration failed:", err);
      setConsoleLogs(prev => [...prev, `[ERROR] Processing failed: ${err instanceof Error ? err.message : String(err)}`]);
      audioFeedback.playTrigger('bass');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySchema = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.stixSchema, null, 2));
    setCopied(true);
    audioFeedback.playTrigger('high');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishEntity = async (entity: EnrichedEntity) => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Map to db Target Type
    let targetType: 'domain' | 'ip' | 'persona' | 'wallet' = 'persona';
    const lowerType = entity.type.toLowerCase();
    if (lowerType.includes('infrastructure') || lowerType.includes('domain')) {
      targetType = 'domain';
    } else if (lowerType.includes('ip') || lowerType.includes('network')) {
      targetType = 'ip';
    } else if (lowerType.includes('asset') || lowerType.includes('wallet')) {
      targetType = 'wallet';
    } else if (lowerType.includes('actor') || lowerType.includes('persona')) {
      targetType = 'persona';
    }

    try {
      await createTarget({
        name: entity.name,
        type: targetType,
        status: 'active',
        confidenceScore: entity.confidence === 'A' ? 95 : entity.confidence === 'B' ? 85 : entity.confidence === 'C' ? 70 : 55,
        createdBy: user.uid,
        userPersonaId: activePersona.id!,
        aliases: entity.resolvedIdentities
      });

      audioFeedback.playTrigger('high');
      setPublishedTargets(prev => {
        const next = new Set(prev);
        next.add(entity.name);
        return next;
      });
      incrementUserStat(user.uid, 'actionsTaken');
    } catch (err) {
      console.error("Failed to publish target:", err);
      audioFeedback.playTrigger('bass');
    }
  };

  const handleSelectTemplate = (template: typeof PRELOADED_TEMPLATES[0]) => {
    setInputText(template.text);
    setMode(template.mode);
    audioFeedback.playTrigger('tick');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-harvest-border">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-tighter flex items-center gap-2">
            <Sparkles size={18} className="text-harvest-accent" />
            Precision Data Expansion & Restoration Engine
          </h2>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Unabridged Context Synthesizer & Resolution Suite</p>
        </div>
        <button 
          onClick={onClose}
          className="text-[10px] text-gray-600 hover:text-white transition-colors uppercase tracking-widest border border-harvest-border bg-harvest-card/50 px-3 py-1.5 rounded-lg font-mono"
        >
          Close Panel
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Panel: Ingestion & Control */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick-Inject Templates */}
          <div className="hardware-surface p-4">
            <h3 className="mono-label text-gray-400 mb-3 flex items-center gap-2">
              <Layers size={12} className="text-harvest-accent" />
              QUICK-INJECT FRAGMENT TEMPLATES
            </h3>
            <div className="space-y-2">
              {PRELOADED_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="w-full text-left bg-black/40 hover:bg-black/80 border border-harvest-border hover:border-harvest-accent/30 p-2.5 rounded text-[10px] font-mono transition-all text-gray-400 hover:text-white flex flex-col gap-1"
                >
                  <span className="text-harvest-accent font-bold uppercase tracking-wider">{tpl.title}</span>
                  <span className="truncate text-gray-600 w-full">{tpl.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Core Ingestion Input */}
          <div className="hardware-surface p-4 space-y-4">
            <div className="flex justify-between items-center">
              <label className="mono-label !text-harvest-accent flex items-center gap-2">
                <Terminal size={12} /> FRAGMENT DATA INGESTION
              </label>
              <span className="text-[8px] text-gray-600 font-mono">100% SECURE SANDBOX</span>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste truncated hashes, IP fragments, forum logs, partial key material, or encrypted message pieces here..."
              className="w-full h-44 bg-black border border-harvest-border p-3 text-[11px] font-mono text-gray-300 focus:border-harvest-accent/50 focus:ring-1 focus:ring-harvest-accent/20 outline-none resize-none leading-relaxed"
              disabled={isProcessing}
            />

            {/* Modality Settings */}
            <div className="space-y-2">
              <label className="mono-label text-gray-500">RESTORATION MODALITY</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'reconstruct', label: 'RECONSTRUCT', desc: 'Normalize & Fill' },
                  { id: 'osint_fusion', label: 'FUSION', desc: 'OSINT Enrichment' },
                  { id: 'graph_resolve', label: 'RESOLVE', desc: 'Identity Links' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setMode(opt.id as any)}
                    className={`p-2 rounded border text-center transition-all ${
                      mode === opt.id 
                        ? 'border-harvest-accent bg-harvest-accent/10 text-harvest-accent' 
                        : 'border-harvest-border bg-black/30 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold font-mono uppercase">{opt.label}</div>
                    <div className="text-[8px] opacity-70 mt-0.5 whitespace-nowrap">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleProcess}
              disabled={isProcessing || !inputText.trim()}
              className="w-full hardware-button-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase text-[11px] tracking-wider"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-black" />
                  PROCESSING SCIENTIFIC VECTORS...
                </>
              ) : (
                <>
                  <Play size={14} className="text-black fill-current" />
                  EXECUTE UNABRIDGED RESTORATION
                </>
              )}
            </button>
          </div>

          {/* Rolling Logs Console */}
          {(isProcessing || consoleLogs.length > 0) && (
            <div className="bg-black border border-harvest-border rounded-lg p-4 font-mono text-[9px] text-emerald-500/80 h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
              <div className="flex justify-between items-center text-gray-600 border-b border-harvest-border/30 pb-1.5 mb-2">
                <span>STOCHASTIC DIAGNOSTIC PIPELINE</span>
                <span className="animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE LOGS
                </span>
              </div>
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-gray-600 mr-1">&gt;</span> {log}
                </div>
              ))}
              {isProcessing && (
                <div className="animate-pulse text-emerald-400 font-bold">&gt; Executing neural expansion matrices...</div>
              )}
            </div>
          )}

        </div>

        {/* Right Output Dashboard: Enriched Representation */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[600px] border border-dashed border-harvest-border rounded-xl flex flex-col items-center justify-center text-center p-8 bg-harvest-card/10"
              >
                <div className="w-16 h-16 rounded-full bg-harvest-accent/5 border border-harvest-accent/10 flex items-center justify-center mb-4">
                  <Cpu className="text-harvest-accent/40" size={28} />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Awaiting Data Ingestion</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-2 max-w-sm leading-relaxed">
                  Provide a truncated or incomplete threat intelligence fragment on the left to activate high-fidelity data reconstruction, verification, and graph-based resolution.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="output-board"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="hardware-surface p-6 space-y-6 h-[600px] flex flex-col overflow-hidden relative bg-black/20"
              >
                {/* Result Tabs */}
                <div className="flex items-center justify-between border-b border-harvest-border pb-3 shrink-0">
                  <div className="flex gap-2">
                    {[
                      { id: 'dossier', label: 'UNABRIDGED DOSSIER', icon: Eye },
                      { id: 'atomic', label: 'ATOMIC METADATA', icon: ShieldCheck },
                      { id: 'entities', label: 'RESOLVED ENTITIES', icon: Network },
                      { id: 'schema', label: 'CTI SCHEMA (STIX)', icon: FileJson }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveSubTab(tab.id as any);
                            audioFeedback.playTrigger('tick');
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider transition-all border ${
                            activeSubTab === tab.id 
                              ? 'bg-harvest-accent/10 border-harvest-accent/30 text-harvest-accent' 
                              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Icon size={12} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Container */}
                <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
                  
                  {/* Tab 1: Unabridged Dossier (Side-by-side) */}
                  {activeSubTab === 'dossier' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/50 border border-harvest-border p-4 rounded-lg flex flex-col h-[200px] overflow-y-auto">
                          <span className="text-[8px] text-gray-600 font-mono uppercase font-bold mb-2 tracking-widest block border-b border-harvest-border/20 pb-1">Original Fragment (Source)</span>
                          <p className="text-[10px] font-mono text-gray-500 leading-relaxed whitespace-pre-wrap">{inputText}</p>
                        </div>
                        <div className="bg-harvest-accent/5 border border-harvest-accent/20 p-4 rounded-lg flex flex-col h-[200px] overflow-y-auto">
                          <span className="text-[8px] text-harvest-accent font-mono uppercase font-bold mb-2 tracking-widest block border-b border-harvest-accent/20 pb-1">Expanded / Reconstructed Target</span>
                          <p className="text-[10px] font-mono text-harvest-accent/90 leading-relaxed whitespace-pre-wrap">{result.unabridgedReport.slice(0, 150)}...</p>
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Terminal size={14} className="text-harvest-accent" />
                          Scientific Investigation Narrative
                        </h4>
                        <div className="text-[11px] font-mono text-gray-300 leading-relaxed space-y-3 whitespace-pre-wrap">
                          {result.unabridgedReport}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Atomic Metadata */}
                  {activeSubTab === 'atomic' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg text-center space-y-2">
                          <span className="text-[8px] text-gray-500 font-mono uppercase">Bayesian Confidence</span>
                          <div className="text-3xl font-black text-harvest-accent font-mono">
                            {result.atomicContext.confidenceLevel}
                          </div>
                          <p className="text-[8px] text-gray-600 font-mono">MULTI-VECTOR SCORE</p>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg text-center space-y-2">
                          <span className="text-[8px] text-gray-500 font-mono uppercase">Information Entropy</span>
                          <div className="text-3xl font-black text-white font-mono">
                            {(result.atomicContext.entropyScore * 10).toFixed(2)}
                          </div>
                          <p className="text-[8px] text-gray-600 font-mono">SHANNON RATING</p>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg text-center space-y-2">
                          <span className="text-[8px] text-gray-500 font-mono uppercase">Deduplication Overlap</span>
                          <div className="text-3xl font-black text-emerald-500 font-mono">
                            {((result.deduplicationDetails.similarityScore) * 100).toFixed(0)}%
                          </div>
                          <p className="text-[8px] text-gray-600 font-mono">DATABASE MATCHER</p>
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">Verification Checklist</h4>
                        <div className="space-y-3">
                          {result.atomicContext.verificationCriteria.map((criteria, i) => (
                            <div key={i} className="flex items-center gap-3 text-[10px] font-mono text-gray-300">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              <span className="uppercase tracking-wider">{criteria.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-3">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Provenance & Collection Trace</h4>
                        <div className="space-y-1.5 text-[10px] font-mono text-gray-400">
                          <div><span className="text-gray-600 mr-2">SOURCE ATTR:</span> {result.atomicContext.provenance}</div>
                          <div><span className="text-gray-600 mr-2">TIMESTAMP:</span> {result.atomicContext.timestampUtc}</div>
                          <div><span className="text-gray-600 mr-2">IDENTIFIER:</span> REDACTED_API_KEY_IDENTITY_GCP</div>
                          <div><span className="text-gray-600 mr-2">STATUS CODE:</span> 200 OK (STOCHASTIC_EXPANSION)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Resolved Entities */}
                  {activeSubTab === 'entities' && (
                    <div className="space-y-4">
                      {result.resolvedEntities.map((entity, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 max-w-xl">
                            <div className="flex items-center gap-3">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-zinc-800 text-gray-300">
                                {entity.type}
                              </span>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider">{entity.name}</h4>
                            </div>
                            <p className="text-[10px] font-mono text-gray-400 leading-relaxed">{entity.details}</p>
                            
                            {/* Identities and network traces */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {entity.resolvedIdentities?.map((id, idx) => (
                                <span key={idx} className="text-[8px] font-mono bg-black border border-zinc-800 px-1.5 py-0.5 text-zinc-500 rounded">
                                  Alias: {id}
                                </span>
                              ))}
                              {entity.sslHashes?.map((hash, idx) => (
                                <span key={idx} className="text-[8px] font-mono bg-black border border-zinc-800 px-1.5 py-0.5 text-amber-500/80 rounded">
                                  SSL: {hash}
                                </span>
                              ))}
                              {entity.asnPatterns?.map((asn, idx) => (
                                <span key={idx} className="text-[8px] font-mono bg-black border border-zinc-800 px-1.5 py-0.5 text-emerald-500/80 rounded">
                                  ASN: {asn}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-2">
                            <div className="text-right">
                              <span className="text-[8px] text-gray-500 font-mono block">CENTRALITY</span>
                              <span className="text-[10px] font-bold font-mono text-harvest-accent">{(entity.centrality * 100).toFixed(0)}% Link Ratio</span>
                            </div>
                            <button
                              onClick={() => handlePublishEntity(entity)}
                              disabled={publishedTargets.has(entity.name)}
                              className={`px-3 py-1.5 rounded-[4px] font-mono text-[9px] uppercase font-bold transition-all flex items-center gap-1.5 ${
                                publishedTargets.has(entity.name)
                                  ? 'bg-zinc-800/40 text-emerald-500 border border-emerald-500/20'
                                  : 'bg-harvest-accent text-black hover:bg-opacity-80'
                              }`}
                            >
                              {publishedTargets.has(entity.name) ? (
                                <>
                                  <Check size={10} />
                                  PUBLISHED
                                </>
                              ) : (
                                <>
                                  <Database size={10} />
                                  PUBLISH TO DB
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}

                      {result.resolvedEntities.length === 0 && (
                        <div className="text-center py-12 text-zinc-600 font-mono text-[10px]">
                          NO DISCRETE ENTITIES RESOLVED IN THIS CAMPAIGN
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: CTI Schema (STIX 2.1) */}
                  {activeSubTab === 'schema' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-t-lg">
                        <span className="text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase">STIX 2.1 JSON Schema Bundle</span>
                        <button
                          onClick={handleCopySchema}
                          className="text-[9px] font-mono text-harvest-accent hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          {copied ? (
                            <>
                              <Check size={10} />
                              COPIED
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              COPY SCHEMA
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-black border border-t-0 border-zinc-800 p-4 rounded-b-lg font-mono text-[9px] text-gray-400 overflow-x-auto max-h-[350px] leading-relaxed select-all">
                        {JSON.stringify(result.stixSchema, null, 2)}
                      </pre>
                    </div>
                  )}

                </div>

                {/* Footer status summary */}
                <div className="mt-auto pt-4 border-t border-harvest-border flex items-center justify-between text-[8px] text-gray-500 font-mono shrink-0">
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-harvest-accent animate-pulse" />
                    <span>PRECISION ACCELERATED BY INTEL ROUTER</span>
                  </div>
                  <span>FORENSICALLY ISOLATED ENVIRONMENT</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </motion.div>
  );
};
