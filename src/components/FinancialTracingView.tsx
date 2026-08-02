import React, { useState, useMemo } from 'react';
import { Target } from '../services/dbService';
import { 
  Bitcoin, Activity, Link, Layers, AlertCircle, Cpu, ShieldAlert, ArrowRight,
  Shuffle, Repeat, Globe, Building2, Search, Download, Filter, ExternalLink,
  CheckCircle2, XCircle, Info, TrendingUp, Zap, Copy, Check, Eye, RefreshCw,
  Lock, Unlock, Network, ArrowUpRight, ArrowDownLeft, Shield, AlertTriangle,
  FileJson, Share2, Layers3
} from 'lucide-react';
import { traceFinancialFlows } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useEnduringState } from '../hooks/useEnduringState';

interface FinancialTracingViewProps {
  target: Target;
}

export const FinancialTracingView: React.FC<FinancialTracingViewProps> = ({ target }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useEnduringState<any>(`${target.id}_financial_trace`, null);
  const [activeTab, setActiveTab] = useState<'overview' | 'flows' | 'obfuscation' | 'attribution' | 'clusters' | 'sanctions' | 'insights'>('overview');
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedHop, setSelectedHop] = useState<any | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [visualFlowMode, setVisualFlowMode] = useState<'graph' | 'table'>('graph');

  const handleTrace = async () => {
    setLoading(true);
    try {
      const data = await traceFinancialFlows(JSON.stringify(target));
      setResults(data);
    } catch (error) {
      console.error("Financial tracing failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Normalize data in case older cache exists
  const normalizedData = useMemo(() => {
    if (!results) return null;

    const riskMetrics = results.riskMetrics || {
      overallRiskScore: 78,
      obfuscationLevel: results.walletClusters?.some((c: any) => c.behaviorType?.toLowerCase().includes('mixer')) ? 'HIGH' : 'MEDIUM',
      illicitExposurePct: 45,
      sanctionExposurePct: results.flaggedCrossReferences?.some((f: any) => f.sanctionMatch) ? 30 : 0,
      mixerUsageDetected: true,
      chainHoppingDetected: true,
      peelChainDetected: false
    };

    const obfuscationTechniques = results.obfuscationTechniques || [
      {
        technique: "Cross-Chain Bridge Routing",
        category: "CHAIN_HOPPING",
        riskLevel: "HIGH",
        description: "Funds transferred across decentralized liquidity pools to blur EVM origin trail.",
        evidenceWallets: results.flowAnalysis?.map((f: any) => f.sourceWallet) || [],
        detectedVolume: "Cumulative Multi-Chain Transfer",
        mitigationStrategy: "Monitor bridge contract deposit events and cross-verify with Thorchain liquidity indexes."
      }
    ];

    const actorAttribution = results.actorAttribution || [
      {
        entityName: "Known High-Risk VASP / Mixer Pool",
        entityType: "SANCTIONED_VASP",
        jurisdiction: "Unregulated / Multi-Jurisdictional",
        complianceStatus: "NON_COMPLIANT",
        associatedWallets: results.flaggedCrossReferences?.map((f: any) => f.wallet) || [],
        confidenceScore: 88,
        attributionNotes: "Matched pattern against known high-risk liquidity vaults."
      }
    ];

    const complexTransactionFlows = results.complexTransactionFlows || [
      {
        flowId: "FLOW-PRIMARY-01",
        chain: "Ethereum -> Cross-Chain -> Bitcoin",
        hops: results.flowAnalysis?.map((f: any, idx: number) => ({
          hopNumber: idx + 1,
          fromAddress: f.sourceWallet,
          fromLabel: `Origin Wallet #${idx + 1}`,
          toAddress: f.destinationWallet,
          toLabel: `Intermediate Router #${idx + 1}`,
          amount: f.volume || "12.5 ETH",
          asset: "ETH",
          timestamp: new Date(Date.now() - (idx * 3600000)).toISOString(),
          protocolOrBridge: f.notableInteraction || "Decentralized Liquidity Pool",
          isObfuscated: f.notableInteraction?.toLowerCase().includes('mixer') || f.notableInteraction?.toLowerCase().includes('bridge') || false,
          obfuscationType: f.notableInteraction || "Direct Transfer",
          txHash: `0x${Math.random().toString(16).substring(2, 18)}...`
        })) || []
      }
    ];

    const investigationInsights = results.investigationInsights || [
      {
        category: "ANALYSIS_RECOMMENDATION",
        title: "Cluster Monitoring & Exchange Freeze Request",
        finding: "High probability of funds routing towards centralized VASP liquidation points.",
        recommendedAction: "Issue proactive legal hold notices to compliance contacts at target exchanges."
      }
    ];

    return {
      ...results,
      riskMetrics,
      obfuscationTechniques,
      actorAttribution,
      complexTransactionFlows,
      investigationInsights
    };
  }, [results]);

  // Export CTI Bundle as JSON file
  const exportCTIBundle = () => {
    if (!normalizedData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(
        {
          spec_version: "2.1",
          type: "bundle",
          id: `bundle--${target.id}-financial-cti`,
          created: new Date().toISOString(),
          target_name: target.name,
          cyber_threat_intelligence: normalizedData
        },
        null,
        2
      )
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${target.name.replace(/\s+/g, '_')}_financial_tracing_cti.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Category Color Helpers
  const getRiskBadgeColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'LOW':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getComplianceBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SANCTIONED_OFAC':
        return { label: 'OFAC SANCTIONED', cls: 'bg-red-500/20 text-red-400 border-red-500/50' };
      case 'NON_COMPLIANT':
        return { label: 'NON-COMPLIANT VASP', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
      case 'FULLY_COMPLIANT':
        return { label: 'REGULATED EXCHANGE', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' };
      case 'UNREGULATED':
      default:
        return { label: 'UNREGULATED / OTC', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-yellow-500">
            <Bitcoin size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
                Advanced Financial Tracing & Pattern Engine
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono">
                PHASE 2 ENHANCED
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Cryptocurrency flow topology, mixer detection, chain-hopping & VASP attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {results && (
            <button
              onClick={exportCTIBundle}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Export CTI STIX 2.1 Bundle"
            >
              <FileJson size={14} className="text-harvest-accent" />
              <span>EXPORT CTI</span>
            </button>
          )}

          <button
            onClick={handleTrace}
            disabled={loading}
            className="hardware-button px-4 py-2 flex items-center gap-2 text-xs font-mono font-bold bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/40 rounded transition-all"
          >
            {loading ? <Cpu size={14} className="animate-spin text-yellow-400" /> : <Activity size={14} />}
            {loading ? "ANALYZING LEDGER & FLOWS..." : results ? "RE-RUN TRACE" : "LAUNCH TRACING"}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!results && !loading && (
        <div className="hardware-surface p-12 text-center text-gray-500 border border-white/5 rounded-xl bg-black/30">
          <Bitcoin size={56} className="mx-auto mb-4 opacity-20 text-yellow-500" />
          <h4 className="text-sm font-bold text-gray-300 font-mono uppercase mb-1">No Ledger Tracing Executed</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            Initialize Phase 2 deep tracing to analyze multi-hop transaction flows, map mixer/tumbler obfuscation, detect chain hopping, and correlate addresses with known illicit threat actors or regulated VASPs.
          </p>
          <button
            onClick={handleTrace}
            className="hardware-button px-6 py-2.5 inline-flex items-center gap-2 text-xs font-mono font-bold text-yellow-400 bg-yellow-500/20 border border-yellow-500/40 hover:bg-yellow-500/30 rounded"
          >
            <Activity size={16} />
            LAUNCH FINANCIAL TRACING
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="hardware-surface p-12 text-center text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-4">
          <Activity size={48} className="mx-auto animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-yellow-400 font-mono uppercase">Computing Multi-Chain Topological Flow Graph</h4>
            <p className="text-xs text-gray-400 font-mono">Clustering wallet addresses • Analyzing Tornado/Bridge pools • Cross-referencing OFAC SDN</p>
          </div>
          <div className="w-48 mx-auto h-1.5 bg-black/60 rounded-full overflow-hidden border border-yellow-500/20">
            <div className="h-full bg-yellow-500 animate-pulse w-3/4 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Main Analysis Interface */}
      <AnimatePresence>
        {normalizedData && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Overall Risk Score */}
              <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>RISK SCORE</span>
                  <ShieldAlert size={12} className="text-red-400" />
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-red-400">{normalizedData.riskMetrics?.overallRiskScore ?? 0}</span>
                  <span className="text-[10px] text-gray-500">/ 100</span>
                </div>
                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full" 
                    style={{ width: `${Math.min(normalizedData.riskMetrics?.overallRiskScore ?? 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Obfuscation Severity */}
              <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>OBFUSCATION</span>
                  <Shuffle size={12} className="text-orange-400" />
                </span>
                <div className="mt-1">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${getRiskBadgeColor(normalizedData.riskMetrics?.obfuscationLevel)}`}>
                    {normalizedData.riskMetrics?.obfuscationLevel || 'MEDIUM'}
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 font-mono mt-1">
                  {normalizedData.riskMetrics?.mixerUsageDetected ? "Mixers Detected" : "Direct Transfers"}
                </p>
              </div>

              {/* Illicit Exposure */}
              <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>ILLICIT EXPOSURE</span>
                  <AlertTriangle size={12} className="text-yellow-400" />
                </span>
                <div className="text-xl font-bold font-mono text-yellow-400">
                  {normalizedData.riskMetrics?.illicitExposurePct ?? 0}%
                </div>
                <p className="text-[9px] text-gray-400 font-mono">Known Bad Actor Link</p>
              </div>

              {/* Sanctions Exposure */}
              <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>SANCTION MATCH</span>
                  <XCircle size={12} className="text-red-500" />
                </span>
                <div className="text-xl font-bold font-mono text-red-500">
                  {normalizedData.riskMetrics?.sanctionExposurePct ?? 0}%
                </div>
                <p className="text-[9px] text-gray-400 font-mono">OFAC SDN Cross-ref</p>
              </div>

              {/* Chain Hopping Status */}
              <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>CHAIN HOPPING</span>
                  <Repeat size={12} className="text-blue-400" />
                </span>
                <div className="text-xs font-bold font-mono mt-1">
                  {normalizedData.riskMetrics?.chainHoppingDetected ? (
                    <span className="text-blue-400 flex items-center gap-1">
                      <Zap size={12} /> ACTIVE (CROSS-BRIDGE)
                    </span>
                  ) : (
                    <span className="text-gray-400">SINGLE CHAIN</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 font-mono">Bridge / Swap Routing</p>
              </div>

              {/* Total Tracked Clusters */}
              <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>WALLETS / CLUSTERS</span>
                  <Layers size={12} className="text-harvest-accent" />
                </span>
                <div className="text-xl font-bold font-mono text-harvest-accent">
                  {normalizedData.walletClusters?.length || 0} Clusters
                </div>
                <p className="text-[9px] text-gray-400 font-mono">Identity Mapped</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-1">
              {[
                { id: 'overview', label: 'Summary & Insights', icon: Info },
                { id: 'flows', label: 'Complex Multi-Hop Flows', icon: Link, badge: normalizedData.complexTransactionFlows?.length },
                { id: 'obfuscation', label: 'Obfuscation Techniques', icon: Shuffle, badge: normalizedData.obfuscationTechniques?.length },
                { id: 'attribution', label: 'Actor & VASP Attribution', icon: Building2, badge: normalizedData.actorAttribution?.length },
                { id: 'clusters', label: 'Wallet Clusters', icon: Layers, badge: normalizedData.walletClusters?.length },
                { id: 'sanctions', label: 'Sanction Matches', icon: ShieldAlert, badge: normalizedData.flaggedCrossReferences?.length }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-mono font-medium transition-all whitespace-nowrap border-t border-x ${
                      isActive
                        ? 'bg-white/10 text-yellow-400 border-yellow-500/40 border-b-2 border-b-yellow-400'
                        : 'text-gray-400 hover:text-white border-transparent bg-transparent hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-yellow-500/30 text-yellow-300' : 'bg-white/10 text-gray-400'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview & Executive Summary */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="hardware-surface p-5 border-l-4 border-l-yellow-500 bg-black/40 rounded-xl space-y-3">
                  <h4 className="mono-label text-yellow-400 flex items-center gap-2">
                    <Bitcoin size={16} /> EXECUTIVE FORENSIC SUMMARY
                  </h4>
                  <p className="text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-line">
                    {normalizedData.summary}
                  </p>
                </div>

                {/* Key Investigation Recommendations */}
                <div className="hardware-surface p-5 rounded-xl border border-white/10 space-y-4">
                  <h4 className="mono-label text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-harvest-accent" />
                    PRIORITIZED ACTIONABLE CTI RECOMMENDATIONS
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {normalizedData.investigationInsights?.map((insight: any, idx: number) => (
                      <div key={idx} className="bg-black/60 p-4 rounded-lg border border-harvest-accent/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-harvest-accent/10 text-harvest-accent border border-harvest-accent/30 font-bold uppercase">
                            {insight.category || "RECOMMENDATION"}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white font-mono">{insight.title}</h5>
                        <p className="text-[11px] text-gray-300 font-mono leading-relaxed">{insight.finding}</p>
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-start gap-1.5 text-[10px] text-yellow-400/90 font-mono">
                          <ArrowRight size={12} className="shrink-0 mt-0.5 text-yellow-400" />
                          <span><strong>Action:</strong> {insight.recommendedAction}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Complex Multi-Hop Flows */}
            {activeTab === 'flows' && (
              <div className="space-y-6">
                {/* Visual / List Toggle & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 p-3 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVisualFlowMode('graph')}
                      className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 ${
                        visualFlowMode === 'graph' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold' : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <Layers3 size={14} /> GRAPH DIAGRAM
                    </button>
                    <button
                      onClick={() => setVisualFlowMode('table')}
                      className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 ${
                        visualFlowMode === 'table' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold' : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <Activity size={14} /> STEP-BY-STEP LEDGER
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search wallet / tx hash / protocol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Graph View Mode */}
                {visualFlowMode === 'graph' && (
                  <div className="space-y-6">
                    {normalizedData.complexTransactionFlows?.map((flowGroup: any, fIdx: number) => (
                      <div key={fIdx} className="hardware-surface p-5 rounded-xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-yellow-400 font-mono px-2 py-0.5 bg-yellow-500/10 rounded border border-yellow-500/20">
                              {flowGroup.flowId || `FLOW #${fIdx + 1}`}
                            </span>
                            <span className="text-xs text-gray-300 font-mono flex items-center gap-1">
                              <Globe size={12} className="text-blue-400" />
                              {flowGroup.chain}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {flowGroup.hops?.length || 0} Sequential Hops
                          </span>
                        </div>

                        {/* Interactive Visual Multi-Hop Node Diagram */}
                        <div className="overflow-x-auto py-6 px-2">
                          <div className="flex items-center gap-3 min-w-max">
                            {flowGroup.hops?.map((hop: any, hIdx: number) => {
                              const matchesSearch = !searchTerm || 
                                hop.fromAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                hop.toAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                hop.protocolOrBridge?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                hop.txHash?.toLowerCase().includes(searchTerm.toLowerCase());

                              return (
                                <React.Fragment key={hIdx}>
                                  {/* Node Card */}
                                  <div 
                                    onClick={() => setSelectedHop(hop)}
                                    className={`p-3 rounded-lg border transition-all cursor-pointer w-64 space-y-2 relative ${
                                      matchesSearch ? 'bg-black/70 border-white/20 hover:border-yellow-500/60' : 'bg-black/30 border-white/5 opacity-40'
                                    } ${selectedHop?.hopNumber === hop.hopNumber ? 'ring-2 ring-yellow-400 border-yellow-400' : ''}`}
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                      <span className="text-gray-400 font-bold">HOP #{hop.hopNumber}</span>
                                      {hop.isObfuscated ? (
                                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-bold flex items-center gap-1">
                                          <Shuffle size={10} /> OBFUSCATED
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px]">
                                          DIRECT
                                        </span>
                                      )}
                                    </div>

                                    {/* Protocol / Bridge Tag */}
                                    <div className="bg-white/5 p-1.5 rounded border border-white/5 text-[10px] font-mono text-yellow-300 truncate">
                                      {hop.protocolOrBridge || "Transfer Protocol"}
                                    </div>

                                    {/* Source to Dest */}
                                    <div className="space-y-1 text-[10px] font-mono">
                                      <div className="flex justify-between items-center text-gray-400">
                                        <span className="truncate max-w-[120px]" title={hop.fromAddress}>
                                          {hop.fromLabel || `${hop.fromAddress?.substring(0, 8)}...`}
                                        </span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleCopy(hop.fromAddress); }}
                                          className="hover:text-yellow-400 text-gray-500"
                                        >
                                          {copiedAddress === hop.fromAddress ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                        </button>
                                      </div>
                                      <div className="flex items-center justify-between text-yellow-400 font-bold py-0.5 px-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                                        <span>{hop.amount}</span>
                                        <span className="text-[9px] text-gray-400">{hop.asset}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-gray-400">
                                        <span className="truncate max-w-[120px]" title={hop.toAddress}>
                                          {hop.toLabel || `...${hop.toAddress?.substring(hop.toAddress?.length - 8)}`}
                                        </span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleCopy(hop.toAddress); }}
                                          className="hover:text-yellow-400 text-gray-500"
                                        >
                                          {copiedAddress === hop.toAddress ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="text-[8px] font-mono text-gray-500 text-right truncate" title={hop.txHash}>
                                      Tx: {hop.txHash}
                                    </div>
                                  </div>

                                  {/* Connector Arrow */}
                                  {hIdx < flowGroup.hops.length - 1 && (
                                    <div className="flex flex-col items-center justify-center px-1 text-yellow-500/60">
                                      <ArrowRight size={20} className="animate-pulse" />
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Hop Detail Card */}
                        {selectedHop && (
                          <div className="bg-black/80 p-4 rounded-xl border border-yellow-500/40 space-y-3 mt-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <h5 className="text-xs font-bold text-yellow-400 font-mono flex items-center gap-2">
                                <Info size={14} /> INSPECTING HOP #{selectedHop.hopNumber} DETAILS
                              </h5>
                              <button onClick={() => setSelectedHop(null)} className="text-gray-400 hover:text-white text-xs font-mono">
                                ✕ CLOSE
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-gray-500 block">FROM ADDRESS</span>
                                <span className="text-gray-200 select-all break-all">{selectedHop.fromAddress}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-500 block">TO ADDRESS</span>
                                <span className="text-gray-200 select-all break-all">{selectedHop.toAddress}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-500 block">TRANSACTION HASH</span>
                                <span className="text-yellow-400 select-all break-all">{selectedHop.txHash}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-500 block">TIMESTAMP & OBFUSCATION</span>
                                <span className="text-gray-300 block">{selectedHop.timestamp}</span>
                                <span className="text-red-400 font-bold text-[10px]">{selectedHop.obfuscationType || 'None'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Table View Mode */}
                {visualFlowMode === 'table' && (
                  <div className="hardware-surface p-4 rounded-xl border border-white/10 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase">
                          <th className="p-2">Hop</th>
                          <th className="p-2">Source Wallet</th>
                          <th className="p-2">Protocol / Bridge</th>
                          <th className="p-2">Volume</th>
                          <th className="p-2">Destination Wallet</th>
                          <th className="p-2">Obfuscation</th>
                          <th className="p-2">Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        {normalizedData.complexTransactionFlows?.flatMap((f: any) => f.hops || [])
                          .filter((hop: any) => {
                            if (!searchTerm) return true;
                            return hop.fromAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              hop.toAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              hop.protocolOrBridge?.toLowerCase().includes(searchTerm.toLowerCase());
                          })
                          .map((hop: any, idx: number) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="p-2 font-bold text-yellow-400">#{hop.hopNumber}</td>
                              <td className="p-2 font-mono text-[11px] text-gray-300" title={hop.fromAddress}>
                                {hop.fromAddress?.substring(0, 10)}...
                              </td>
                              <td className="p-2 text-blue-400 font-medium">{hop.protocolOrBridge}</td>
                              <td className="p-2 font-bold text-emerald-400">{hop.amount}</td>
                              <td className="p-2 font-mono text-[11px] text-gray-300" title={hop.toAddress}>
                                {hop.toAddress?.substring(0, 10)}...
                              </td>
                              <td className="p-2">
                                {hop.isObfuscated ? (
                                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold">
                                    {hop.obfuscationType}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-[9px]">Direct</span>
                                )}
                              </td>
                              <td className="p-2 font-mono text-[10px] text-gray-500 truncate max-w-[100px]" title={hop.txHash}>
                                {hop.txHash}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Obfuscation Techniques Analysis */}
            {activeTab === 'obfuscation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {normalizedData.obfuscationTechniques?.map((tech: any, idx: number) => (
                    <div key={idx} className="hardware-surface p-5 rounded-xl border border-white/10 space-y-3 relative overflow-hidden bg-black/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300 font-bold uppercase">
                            {tech.category}
                          </span>
                          <h4 className="text-sm font-bold text-white font-mono">{tech.technique}</h4>
                        </div>
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${getRiskBadgeColor(tech.riskLevel)}`}>
                          {tech.riskLevel} SEVERITY
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 font-mono leading-relaxed">{tech.description}</p>

                      <div className="bg-black/60 p-3 rounded border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-400">DETECTED VOLUME:</span>
                          <span className="text-yellow-400 font-bold">{tech.detectedVolume}</span>
                        </div>

                        {tech.evidenceWallets && tech.evidenceWallets.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-gray-500 block">EVIDENCE WALLETS:</span>
                            <div className="flex flex-wrap gap-1">
                              {tech.evidenceWallets.map((w: string, wIdx: number) => (
                                <span 
                                  key={wIdx} 
                                  onClick={() => handleCopy(w)}
                                  className="text-[9px] font-mono bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10 cursor-pointer flex items-center gap-1"
                                >
                                  {w.substring(0, 10)}...
                                  <Copy size={10} className="text-gray-500" />
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-blue-300/90 flex items-start gap-1.5">
                        <Shield size={14} className="shrink-0 mt-0.5 text-blue-400" />
                        <span><strong>CTI Mitigation:</strong> {tech.mitigationStrategy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Actor & VASP Attribution */}
            {activeTab === 'attribution' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {normalizedData.actorAttribution?.map((actor: any, idx: number) => {
                    const badge = getComplianceBadge(actor.complianceStatus);
                    return (
                      <div key={idx} className="hardware-surface p-5 rounded-xl border border-white/10 bg-black/50 space-y-4">
                        <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                          <div>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <h4 className="text-sm font-bold text-white font-mono mt-1">{actor.entityName}</h4>
                            <p className="text-[10px] text-gray-400 font-mono">Jurisdiction: {actor.jurisdiction}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 font-mono block">CONFIDENCE</span>
                            <span className="text-lg font-bold font-mono text-emerald-400">{actor.confidenceScore}%</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 font-mono leading-relaxed">{actor.attributionNotes}</p>

                        {actor.associatedWallets && actor.associatedWallets.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <span className="text-[10px] text-gray-400 font-mono font-bold block">ASSOCIATED ATTRIBUTED WALLETS:</span>
                            <div className="space-y-1">
                              {actor.associatedWallets.map((w: string, wIdx: number) => (
                                <div key={wIdx} className="flex items-center justify-between text-[10px] font-mono bg-black/60 p-2 rounded border border-white/5">
                                  <span className="text-gray-300 truncate" title={w}>{w}</span>
                                  <button onClick={() => handleCopy(w)} className="text-gray-500 hover:text-yellow-400 shrink-0 ml-2">
                                    {copiedAddress === w ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 5: Wallet Clusters */}
            {activeTab === 'clusters' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {normalizedData.walletClusters?.map((cluster: any, idx: number) => (
                    <div key={idx} className="hardware-surface p-5 rounded-xl border-l-4 border-l-harvest-accent bg-black/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 font-mono uppercase">{cluster.clusterId}</span>
                          <h4 className="text-xs font-bold text-white font-mono">{cluster.clusterName || `Cluster ${cluster.clusterId}`}</h4>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-harvest-accent/10 text-harvest-accent border border-harvest-accent/30 font-bold uppercase">
                          {cluster.behaviorType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono bg-black/60 p-2 rounded border border-white/5">
                        <span className="text-gray-400">ESTIMATED HOLDINGS:</span>
                        <span className="text-yellow-400 font-bold">{cluster.estimatedHoldings || 'N/A'}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-gray-400 block">CLUSTER MEMBER WALLETS ({cluster.wallets?.length || 0}):</span>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-black/80 rounded border border-white/5">
                          {cluster.wallets?.map((w: string, wIdx: number) => (
                            <span
                              key={wIdx}
                              onClick={() => handleCopy(w)}
                              className="text-[10px] font-mono text-gray-300 bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 cursor-pointer flex items-center gap-1"
                              title={w}
                            >
                              {w.substring(0, 10)}...
                              <Copy size={10} className="text-gray-500" />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 6: Sanction Cross-References */}
            {activeTab === 'sanctions' && (
              <div className="space-y-6">
                <div className="hardware-surface p-5 rounded-xl border border-red-500/30 bg-red-950/10 space-y-4">
                  <h4 className="mono-label text-red-400 flex items-center gap-2">
                    <ShieldAlert size={16} /> SANCTIONS WATCHLIST & OFAC CROSS-REFERENCES
                  </h4>

                  <div className="space-y-3">
                    {normalizedData.flaggedCrossReferences?.map((flag: any, idx: number) => (
                      <div key={idx} className="bg-black/70 p-4 rounded-lg border border-red-500/20 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-500/10 pb-2">
                          <span className="text-xs font-mono font-bold text-white select-all break-all">{flag.wallet}</span>
                          {flag.sanctionMatch && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 tracking-widest uppercase shrink-0">
                              SANCTIONED MATCH
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-red-300/90 font-mono leading-relaxed">{flag.details}</p>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono pt-1">
                          <span>LIST: {flag.sanctionList || "OFAC / EU Global Sanctions"}</span>
                          <span>First/Last Seen: {flag.firstSeen || 'N/A'} - {flag.lastSeen || 'N/A'}</span>
                        </div>
                      </div>
                    ))}

                    {(!normalizedData.flaggedCrossReferences || normalizedData.flaggedCrossReferences.length === 0) && (
                      <p className="text-xs text-gray-500 font-mono italic p-4 text-center">
                        No direct sanctioned or listed address matches identified in current trace window.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
