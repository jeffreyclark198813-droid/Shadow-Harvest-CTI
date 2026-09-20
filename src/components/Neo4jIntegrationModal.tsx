import React, { useState, useMemo } from 'react';
import { Database, CheckCircle2, AlertTriangle, Play, Copy, Check, Download, Layers, ShieldCheck, RefreshCw, X, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  exportToNeo4jCypher, 
  exportToMaltegoCsv, 
  exportToMaltegoGraphML, 
  testNeo4jConnection, 
  syncToNeo4j, 
  queryNeo4j,
  calculateGraphStats,
  classifyDimension,
  DIMENSION_COLORS,
  DIMENSION_LABELS
} from '../services/unifiedGraphService';
import { UnifiedGraphNode, UnifiedGraphEdge } from '../types/unifiedGraph';

interface Neo4jIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: UnifiedGraphNode[];
  edges: UnifiedGraphEdge[];
  targetName?: string;
}

export const Neo4jIntegrationModal: React.FC<Neo4jIntegrationModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  targetName = 'Target'
}) => {
  const [activeTab, setActiveTab] = useState<'neo4j' | 'maltego' | 'cypher_script'>('neo4j');
  
  // Neo4j config state (prefilled with standard defaults)
  const [uri, setUri] = useState('neo4j://localhost:7687');
  const [username, setUsername] = useState('neo4j');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('neo4j');
  
  // Connection / sync state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; serverInfo?: any } | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; syncedNodes?: number; syncedEdges?: number } | null>(null);

  // Cypher query console state
  const [cypherQuery, setCypherQuery] = useState('MATCH (n:Entity) RETURN n.dimension AS Dimension, count(n) AS Count ORDER BY Count DESC;');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Copied state
  const [copied, setCopied] = useState(false);

  const normalizedNodes: UnifiedGraphNode[] = useMemo(() => {
    return (nodes || []).map(n => ({
      ...n,
      dimension: n.dimension || classifyDimension(n.type || ''),
      label: n.label || n.id || 'Unknown',
      type: n.type || 'entity'
    }));
  }, [nodes]);

  const normalizedEdges: UnifiedGraphEdge[] = useMemo(() => {
    return (edges || []).map(e => ({
      ...e,
      relationship: e.relationship || 'RELATES_TO',
      confidence: e.confidence ?? 1.0
    }));
  }, [edges]);

  const stats = useMemo(() => calculateGraphStats(normalizedNodes, normalizedEdges), [normalizedNodes, normalizedEdges]);
  const generatedCypher = useMemo(() => exportToNeo4jCypher(normalizedNodes, normalizedEdges, targetName), [normalizedNodes, normalizedEdges, targetName]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testNeo4jConnection({ uri, username, password, database });
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncToNeo4j = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncToNeo4j({ uri, username, password, database }, normalizedNodes, normalizedEdges, targetName);
      setSyncResult(res);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunQuery = async () => {
    setIsQuerying(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await queryNeo4j({ uri, username, password, database }, cypherQuery);
      if (res.success && res.records) {
        setQueryResult(res.records);
      } else {
        setQueryError(res.message || 'Query execution failed.');
      }
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopyCypher = () => {
    navigator.clipboard.writeText(generatedCypher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCypher = () => {
    const blob = new Blob([generatedCypher], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetName.toLowerCase().replace(/\s+/g, '_')}_unified_intelligence.cypher`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMaltegoCsv = () => {
    const csv = exportToMaltegoCsv(normalizedNodes, normalizedEdges);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetName.toLowerCase().replace(/\s+/g, '_')}_maltego_table.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMaltegoGraphML = () => {
    const xml = exportToMaltegoGraphML(normalizedNodes, normalizedEdges);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetName.toLowerCase().replace(/\s+/g, '_')}_maltego_graph.graphml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[250]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#101010] border border-[#262626] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Unified Intelligence Graph Integration
              </h3>
              <p className="text-[11px] text-gray-400 font-sans">
                Neo4j Graph Database persistence and Maltego structured intelligence ingestion.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 4 Pillars Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-black/30 border-b border-[#1c1c1c] text-[10px]">
          <div className="bg-[#141414] border border-[#222] p-2.5 rounded">
            <span className="text-gray-500 block text-[9px] uppercase">Infrastructure</span>
            <span className="font-bold text-cyan-400 font-mono text-xs">{stats.infrastructureCount} Nodes</span>
          </div>
          <div className="bg-[#141414] border border-[#222] p-2.5 rounded">
            <span className="text-gray-500 block text-[9px] uppercase">Identities & Personas</span>
            <span className="font-bold text-pink-400 font-mono text-xs">{stats.identityCount} Nodes</span>
          </div>
          <div className="bg-[#141414] border border-[#222] p-2.5 rounded">
            <span className="text-gray-500 block text-[9px] uppercase">Financial Flows</span>
            <span className="font-bold text-amber-400 font-mono text-xs">{stats.financialCount} Nodes</span>
          </div>
          <div className="bg-[#141414] border border-[#222] p-2.5 rounded">
            <span className="text-gray-500 block text-[9px] uppercase">Technical Artifacts</span>
            <span className="font-bold text-emerald-400 font-mono text-xs">{stats.artifactCount} Nodes</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#222] bg-[#141414] px-4">
          <button
            onClick={() => setActiveTab('neo4j')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'neo4j'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Database size={14} />
            Neo4j Live Database
          </button>

          <button
            onClick={() => setActiveTab('maltego')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'maltego'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers size={14} />
            Maltego Ingestion Suite
          </button>

          <button
            onClick={() => setActiveTab('cypher_script')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'cypher_script'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Play size={14} />
            Generated Cypher Script
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: NEO4J */}
          {activeTab === 'neo4j' && (
            <div className="space-y-5">
              <div className="bg-[#141414] border border-[#222] p-4 rounded-lg space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Connection Parameters</span>
                  <span className="text-[10px] text-gray-400 font-normal">Supports Bolt / Neo4j Aura</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">Bolt URI</label>
                    <input
                      type="text"
                      value={uri}
                      onChange={(e) => setUri(e.target.value)}
                      placeholder="neo4j+s://xxxx.databases.neo4j.io"
                      className="w-full bg-black/60 border border-[#2a2a2a] rounded px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">Database Name</label>
                    <input
                      type="text"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      placeholder="neo4j"
                      className="w-full bg-black/60 border border-[#2a2a2a] rounded px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="neo4j"
                      className="w-full bg-black/60 border border-[#2a2a2a] rounded px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Neo4j password"
                      className="w-full bg-black/60 border border-[#2a2a2a] rounded px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Connection Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2 bg-[#202020] hover:bg-[#282828] text-white rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-2 border border-[#333] transition-colors disabled:opacity-50"
                  >
                    {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                    {isTesting ? 'Testing Handshake...' : 'Test Connection'}
                  </button>

                  <button
                    onClick={handleSyncToNeo4j}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    {isSyncing ? 'Synchronizing Topology...' : `Push Graph (${nodes.length} Nodes, ${edges.length} Edges)`}
                  </button>
                </div>

                {/* Status Messages */}
                {testResult && (
                  <div
                    className={`p-3 rounded border text-[11px] flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-bold">{testResult.message}</p>
                      {testResult.serverInfo && (
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Agent: {testResult.serverInfo.agent} | Protocol: {testResult.serverInfo.protocolVersion}</p>
                      )}
                    </div>
                  </div>
                )}

                {syncResult && (
                  <div
                    className={`p-3 rounded border text-[11px] flex items-start gap-2.5 ${
                      syncResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{syncResult.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Synchronized across 4 unified intelligence dimensions: Infrastructure, Identities, Financial Flows, and Technical Artifacts.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Cypher Query Console */}
              <div className="bg-[#141414] border border-[#222] p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Play size={13} className="text-emerald-400" />
                    Interactive Cypher Query Console
                  </h4>
                  <span className="text-[10px] text-gray-500">Target: {database}</span>
                </div>

                <div className="relative">
                  <textarea
                    value={cypherQuery}
                    onChange={(e) => setCypherQuery(e.target.value)}
                    rows={3}
                    className="w-full bg-black/70 border border-[#2a2a2a] rounded p-3 text-emerald-400 font-mono text-xs focus:border-emerald-500 outline-none resize-none"
                  />
                  <button
                    onClick={handleRunQuery}
                    disabled={isQuerying}
                    className="absolute bottom-3 right-3 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isQuerying ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                    Execute
                  </button>
                </div>

                {queryError && (
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[10px]">
                    {queryError}
                  </div>
                )}

                {queryResult && (
                  <div className="bg-black/50 border border-[#222] rounded p-3 space-y-1 max-h-40 overflow-y-auto">
                    <span className="text-[9px] uppercase text-gray-500 block font-bold">Query Execution Results ({queryResult.length} records)</span>
                    <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(queryResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MALTEGO INGESTION SUITE */}
          {activeTab === 'maltego' && (
            <div className="space-y-5">
              <div className="bg-[#141414] border border-[#222] p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Layers size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Maltego Ingestion Suite</h4>
                </div>
                <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                  Export intelligence ready for instantaneous visualization in Maltego Classic, XL, or CE. The output maps directly to standard Maltego Entity types (<code className="text-blue-300">maltego.Person</code>, <code className="text-blue-300">maltego.IPv4Address</code>, <code className="text-blue-300">maltego.Domain</code>, <code className="text-blue-300">maltego.CryptocurrencyWallet</code>, <code className="text-blue-300">maltego.Hash</code>) with link labels and confidence weighting.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Option 1: Maltego CSV Table */}
                  <div className="bg-black/40 border border-[#262626] p-4 rounded-lg space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                          <FileSpreadsheet size={14} className="text-blue-400" /> Maltego Table CSV
                        </span>
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-sans">
                        Structured with <code className="text-gray-300">Entity.Type1</code>, <code className="text-gray-300">Entity.Value1</code>, <code className="text-gray-300">Link.Label</code>, and visual weights for Maltego's <em>Import Graph from Table</em> wizard.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadMaltegoCsv}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-colors shadow"
                    >
                      <Download size={13} />
                      Download Maltego CSV Table
                    </button>
                  </div>

                  {/* Option 2: Maltego GraphML */}
                  <div className="bg-black/40 border border-[#262626] p-4 rounded-lg space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                          <Layers size={14} className="text-emerald-400" /> Standard GraphML XML
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                          Universal
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-sans">
                        GraphML XML graph specification including custom attribute keys (<code className="text-gray-300">d_dimension</code>, <code className="text-gray-300">d_confidence</code>) compatible with Maltego, Gephi, and Cytoscape.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadMaltegoGraphML}
                      className="w-full py-2 bg-[#222] hover:bg-[#2a2a2a] text-white rounded font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 border border-[#3a3a3a] transition-colors"
                    >
                      <Download size={13} />
                      Download GraphML (XML)
                    </button>
                  </div>
                </div>

                {/* Maltego Ingestion Steps */}
                <div className="bg-black/50 border border-[#222] p-3.5 rounded-lg space-y-2 text-[10px]">
                  <span className="text-gray-400 uppercase font-bold tracking-wider block">How to Ingest in Maltego:</span>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300 font-sans">
                    <li>Open <strong>Maltego Desktop</strong> and create a new graph.</li>
                    <li>Go to the <strong>Investigate</strong> tab &rarr; click <strong>Import Graph from Table</strong>.</li>
                    <li>Select the downloaded <code className="text-blue-300">.csv</code> file.</li>
                    <li>Map Column 1 to <em>Source Entity Type</em>, Column 2 to <em>Source Entity Value</em>, Column 7 to <em>Link Label</em>, and Columns 4 & 5 to <em>Target Entity</em>.</li>
                    <li>Click <strong>Generate Graph</strong> to see the complete unified threat web immediately.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CYPHER SCRIPT */}
          {activeTab === 'cypher_script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Idempotent Neo4j Cypher Script
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    Ready to paste into Neo4j Browser, Neo4j Bloom, or cypher-shell.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCypher}
                    className="px-3 py-1.5 bg-[#202020] hover:bg-[#282828] text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#333] transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied to Clipboard' : 'Copy Cypher'}
                  </button>

                  <button
                    onClick={handleDownloadCypher}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={12} />
                    Download .cypher
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="w-full bg-black/80 border border-[#2a2a2a] rounded-lg p-4 text-emerald-400 font-mono text-[10px] max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {generatedCypher}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222] bg-black/40 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">
            Target: <strong className="text-white">{targetName}</strong> | {nodes.length} Entities | {edges.length} Cross-Pillar Relationships
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#222] hover:bg-[#2c2c2c] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
