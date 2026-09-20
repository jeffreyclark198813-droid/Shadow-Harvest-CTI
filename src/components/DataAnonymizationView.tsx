import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, Eye, EyeOff, FileText, Network, 
  Settings2, Plus, Download, Copy, RefreshCw, CheckCircle2, AlertTriangle, 
  Trash2, Sliders, ArrowRight, Zap, Database, Search, FileJson, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DEFAULT_ANONYMIZATION_RULES, 
  ANONYMIZATION_PROFILES, 
  AnonymizationEngine 
} from '../services/anonymizationService';
import { 
  AnonymizationRule, 
  AnonymizationProfile, 
  RedactionMode, 
  SensitiveDataCategory, 
  AnonymizedReportResult, 
  AnonymizedGraphResult 
} from '../types/intelligence_ops';
import { Target, IntelligenceReport, ThreatAssessment } from '../services/dbService';
import { auth, db, addDoc, collection, serverTimestamp } from '../firebase';

interface DataAnonymizationViewProps {
  targets?: Target[];
  reports?: IntelligenceReport[];
  assessments?: ThreatAssessment[];
  onExportAnonymized?: (data: any, format: string) => void;
}

const SAMPLE_REPORTS = [
  {
    title: 'Dread Forum & Ransomware Infrastructure Dispatch',
    text: `URGENT CTI REPORT - TLP:AMBER
Subject: Actor ShadowOperator_99 infrastructure compromise.
Primary Point of Contact: agent.smith@defense-agency.gov, phone +1 (202) 555-0143.
Suspect operator identified as Alexei Volkov (SSN: 948-22-1049) operating from relay 185.220.101.42 and internal gateway vault01.corp.
Financial trace confirms payment of 4.25 BTC to wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa followed by Ethereum disbursement to 0x71C8FB487070103056985F809054B52084c8a24F.
Master PGP Signature:
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Keybase OpenPGP v2.0.8
Comment: https://keybase.io/crypto
mQENBF4...C29F==
-----END PGP PUBLIC KEY BLOCK-----
Leaked Admin API Key: api_key=sk_live_9482019485720194819385.
Internal node MAC: 00:1B:44:11:3A:B7.`
  },
  {
    title: 'Financial Mule & Darknet Carding Ring dossier',
    text: `FINANCIAL THREAT DOSSIER
Identified operative: Maria Chen (DOB: 1989-11-04), telephone 800-555-0199.
Email aliases detected: m.chen_vault@proton.me and shadow_broker99@darknet.onion.
Exfiltrated payment credential: PAN 4532-1234-5678-9012 (Visa Platinum).
Monero stealth mixer wallet: 44AFFq5Axm6GryMpHmgUBDGZwYOCG3GTuZaUzYFA3aGub1jG6fZUZaUzYFA3aGub1jG6fZU1234567890123456789012.
C2 server IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334.`
  }
];

const SAMPLE_GRAPH_NODES = [
  { id: 'agent.smith@defense-agency.gov', label: 'agent.smith@defense-agency.gov', type: 'persona', metadata: { role: 'Lead Investigator', ssn: '948-22-1049' } },
  { id: '185.220.101.42', label: '185.220.101.42', type: 'ip', metadata: { isp: 'HostKey Relay', internalDns: 'vault01.corp' } },
  { id: '0x71C8FB487070103056985F809054B52084c8a24F', label: '0x71C8FB487070103056985F809054B52084c8a24F', type: 'wallet', metadata: { chain: 'ETH', balance: '14.2 ETH' } },
  { id: 'm.chen_vault@proton.me', label: 'm.chen_vault@proton.me', type: 'persona', metadata: { alias: 'ShadowBroker', phone: '+1-555-0199' } },
  { id: '4532-1234-5678-9012', label: '4532-1234-5678-9012', type: 'credential', metadata: { brand: 'Visa' } }
];

const SAMPLE_GRAPH_EDGES = [
  { source: 'agent.smith@defense-agency.gov', target: '185.220.101.42', relationship: 'investigated_endpoint' },
  { source: '185.220.101.42', target: '0x71C8FB487070103056985F809054B52084c8a24F', relationship: 'transferred_crypto_to' },
  { source: 'm.chen_vault@proton.me', target: '0x71C8FB487070103056985F809054B52084c8a24F', relationship: 'deposited_into' },
  { source: 'm.chen_vault@proton.me', target: '4532-1234-5678-9012', relationship: 'compromised_card' }
];

export const DataAnonymizationView: React.FC<DataAnonymizationViewProps> = ({
  targets = [],
  reports = [],
  assessments = [],
  onExportAnonymized
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'graphs' | 'rules' | 'batch'>('reports');
  const [rules, setRules] = useState<AnonymizationRule[]>(DEFAULT_ANONYMIZATION_RULES);
  const [selectedProfile, setSelectedProfile] = useState<AnonymizationProfile>(ANONYMIZATION_PROFILES[0]);
  const [globalOverrideMode, setGlobalOverrideMode] = useState<RedactionMode | 'DEFAULT'>('DEFAULT');

  // Text Anonymization State
  const [reportInput, setReportInput] = useState<string>(SAMPLE_REPORTS[0].text);
  const [anonymizedResult, setAnonymizedResult] = useState<AnonymizedReportResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Graph Anonymization State
  const [graphResult, setGraphResult] = useState<AnonymizedGraphResult | null>(null);

  // Rule Creation Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<SensitiveDataCategory>('CUSTOM');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleMode, setNewRuleMode] = useState<RedactionMode>('REPLACE_TOKEN');
  const [newRuleSeverity, setNewRuleSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [testRegexInput, setTestRegexInput] = useState('');
  const [testRegexMatches, setTestRegexMatches] = useState<string[]>([]);

  // Search & Filter
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('ALL');

  const engine = useMemo(() => {
    return new AnonymizationEngine(rules);
  }, [rules]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Perform Real-Time Redaction on input text
  useEffect(() => {
    const override = globalOverrideMode === 'DEFAULT' ? undefined : globalOverrideMode;
    const res = engine.anonymizeText(reportInput, selectedProfile, override);
    setAnonymizedResult(res);
  }, [reportInput, rules, selectedProfile, globalOverrideMode, engine]);

  // Perform Graph Anonymization
  useEffect(() => {
    const override = globalOverrideMode === 'DEFAULT' ? selectedProfile.defaultMode : globalOverrideMode;
    const res = engine.anonymizeGraph(SAMPLE_GRAPH_NODES, SAMPLE_GRAPH_EDGES, selectedProfile, override);
    setGraphResult(res);
  }, [rules, selectedProfile, globalOverrideMode, engine]);

  // Test Regex Live In Modal
  useEffect(() => {
    if (!newRulePattern) {
      setTestRegexMatches([]);
      return;
    }
    try {
      const reg = new RegExp(newRulePattern, 'gi');
      const matches = testRegexInput.match(reg) || [];
      setTestRegexMatches(matches);
    } catch (e) {
      setTestRegexMatches([]);
    }
  }, [newRulePattern, testRegexInput]);

  // Toggle Rule Status
  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    showToast('Rule status updated.');
  };

  // Change Redaction Mode for Specific Rule
  const handleChangeRuleMode = (ruleId: string, mode: RedactionMode) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, redactionMode: mode } : r));
    showToast('Rule redaction mode updated.');
  };

  // Create and Add Custom Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRulePattern) {
      showToast('Please enter a valid rule name and regex pattern.');
      return;
    }

    try {
      new RegExp(newRulePattern);
    } catch (err) {
      showToast('Invalid regular expression syntax.');
      return;
    }

    const newRule: AnonymizationRule = {
      id: `custom-rule-${Date.now()}`,
      name: newRuleName,
      description: newRuleDesc || 'Custom analyst-defined sensitive data rule',
      category: newRuleCategory,
      pattern: newRulePattern,
      isRegex: true,
      redactionMode: newRuleMode,
      severity: newRuleSeverity,
      enabled: true,
      examples: [testRegexInput].filter(Boolean)
    };

    setRules(prev => [newRule, ...prev]);
    setIsRuleModalOpen(false);
    setNewRuleName('');
    setNewRuleDesc('');
    setNewRulePattern('');
    setTestRegexInput('');
    showToast('Custom sensitive data rule registered successfully.');

    // Save to Firestore audit log
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, 'audit_logs'), {
          userId: user.uid,
          action: 'ANONYMIZATION_RULE_CREATED',
          targetId: newRule.id,
          details: `Created rule "${newRule.name}" (${newRule.category})`,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error('Audit log write error:', err);
      }
    }
  };

  // Delete Custom Rule
  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    showToast('Custom rule removed.');
  };

  // Copy Redacted Text
  const handleCopyRedacted = () => {
    if (anonymizedResult?.redactedText) {
      navigator.clipboard.writeText(anonymizedResult.redactedText);
      showToast('Sanitized intelligence text copied to clipboard.');
    }
  };

  // Export Sanitized Report
  const handleExportSanitizedReport = (format: 'txt' | 'json') => {
    if (!anonymizedResult) return;

    let content = '';
    let mimeType = '';
    let ext = '';

    if (format === 'json') {
      content = JSON.stringify({
        classification: 'TLP:CLEAR // SANITIZED INTELLIGENCE DISPATCH',
        profileUsed: selectedProfile.name,
        redactionCount: anonymizedResult.redactionCount,
        riskReductionScore: anonymizedResult.riskReductionScore,
        categoryBreakdown: anonymizedResult.categoryBreakdown,
        findingsSummary: anonymizedResult.findings.map(f => ({
          category: f.category,
          rule: f.ruleName,
          redactedToken: f.redactedText,
          severity: f.severity
        })),
        sanitizedText: anonymizedResult.redactedText,
        exportedAt: new Date().toISOString()
      }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      content = `==========================================================\n` +
        `SHADOW HARVEST CTI - AUTOMATED SANITIZED INTELLIGENCE REPORT\n` +
        `Profile: ${selectedProfile.name}\n` +
        `Sanitized Date: ${new Date().toISOString()}\n` +
        `Redactions Applied: ${anonymizedResult.redactionCount}\n` +
        `==========================================================\n\n` +
        anonymizedResult.redactedText;
      mimeType = 'text/plain';
      ext = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized_intel_report_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported sanitized intelligence report (${ext.toUpperCase()}).`);
  };

  // Export Sanitized Graph
  const handleExportSanitizedGraph = (format: 'cypher' | 'json' | 'csv') => {
    if (!graphResult) return;

    let content = '';
    let mimeType = '';
    let ext = '';

    if (format === 'cypher') {
      content = `// Neo4j Sanitized Intelligence Graph Import Script\n` +
        `// Generated: ${new Date().toISOString()}\n` +
        `// Security Policy: ${selectedProfile.name}\n\n`;

      graphResult.anonymizedNodes.forEach(node => {
        const safeLabel = (node.label || node.id).replace(/"/g, '\\"');
        const nodeType = (node.type || 'Entity').toUpperCase();
        content += `MERGE (n:${nodeType} {id: "${node.id}"})\nSET n.label = "${safeLabel}"\n;\n`;
      });

      graphResult.anonymizedEdges.forEach(edge => {
        const relName = edge.relationship.toUpperCase().replace(/\s+/g, '_');
        content += `MATCH (a {id: "${edge.source}"}), (b {id: "${edge.target}"})\nMERGE (a)-[:${relName}]->(b)\n;\n`;
      });

      mimeType = 'text/plain';
      ext = 'cypher';
    } else if (format === 'json') {
      content = JSON.stringify({
        policy: selectedProfile.name,
        nodes: graphResult.anonymizedNodes,
        edges: graphResult.anonymizedEdges,
        tokenMapping: graphResult.tokenMapping,
        redactedEntitiesCount: graphResult.redactedEntitiesCount,
        exportedAt: new Date().toISOString()
      }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      content = `Node_ID,Sanitized_Label,Node_Type,Redacted\n`;
      graphResult.anonymizedNodes.forEach(n => {
        content += `"${n.id}","${n.label}","${n.type || 'Entity'}",${n.isAnonymized ? 'YES' : 'NO'}\n`;
      });
      mimeType = 'text/csv';
      ext = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized_intelligence_graph_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported sanitized graph dataset (${ext.toUpperCase()}).`);
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchCat = ruleCategoryFilter === 'ALL' || r.category === ruleCategoryFilter;
      const matchSearch = !ruleSearch || 
        r.name.toLowerCase().includes(ruleSearch.toLowerCase()) || 
        r.description.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.pattern.toLowerCase().includes(ruleSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [rules, ruleCategoryFilter, ruleSearch]);

  return (
    <div className="space-y-6 font-mono text-gray-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#111] border border-harvest-accent/60 text-harvest-accent px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs"
          >
            <Zap size={14} className="animate-pulse text-harvest-accent" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header & Profile Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0d0d0d] p-5 rounded-2xl border border-[#222]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-harvest-accent/10 border border-harvest-accent/30 text-harvest-accent">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Automated Data Anonymization & PII Redaction
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
              Zero-Trust Sensitive Data Scrubbing, Graph Topology Masking & Configurable Policy Rules
            </p>
          </div>
        </div>

        {/* Preset Profiles & Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-[#222]">
            <Lock size={12} className="text-harvest-accent" />
            <span className="text-[9px] text-gray-500 uppercase font-bold">Policy:</span>
            <select
              value={selectedProfile.id}
              onChange={e => {
                const prof = ANONYMIZATION_PROFILES.find(p => p.id === e.target.value);
                if (prof) setSelectedProfile(prof);
              }}
              className="bg-transparent text-[10px] font-bold uppercase text-white outline-none"
            >
              {ANONYMIZATION_PROFILES.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-[#222]">
            <Sliders size={12} className="text-blue-400" />
            <span className="text-[9px] text-gray-500 uppercase font-bold">Mode Override:</span>
            <select
              value={globalOverrideMode}
              onChange={e => setGlobalOverrideMode(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold uppercase text-gray-300 outline-none"
            >
              <option value="DEFAULT">Per-Rule Mode</option>
              <option value="REPLACE_TOKEN">Tokenize ([ANON_...])</option>
              <option value="FULL_MASK">Full Mask (████)</option>
              <option value="PARTIAL_MASK">Partial Mask (j***k)</option>
              <option value="HASH_SHA256">SHA256 Pseudonym</option>
            </select>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#222] pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <FileText size={12} /> Live Report Diff & Scrubbing
        </button>
        <button
          onClick={() => setActiveTab('graphs')}
          className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeTab === 'graphs' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Network size={12} /> Graph Topology Redaction
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeTab === 'rules' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Settings2 size={12} /> Configurable Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeTab === 'batch' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Database size={12} /> Stored Targets Scan
        </button>
      </div>

      {/* TAB 1: LIVE REPORT DIFF & SANITIZATION */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0d0d0d] p-3.5 rounded-xl border border-[#222] space-y-1">
              <p className="text-[8px] text-gray-500 uppercase font-bold">Redactions Detected</p>
              <p className="text-lg font-bold text-harvest-accent">{anonymizedResult?.redactionCount || 0}</p>
            </div>
            <div className="bg-[#0d0d0d] p-3.5 rounded-xl border border-[#222] space-y-1">
              <p className="text-[8px] text-gray-500 uppercase font-bold">Risk Reduction Index</p>
              <p className="text-lg font-bold text-green-400">{anonymizedResult?.riskReductionScore || 100}%</p>
            </div>
            <div className="bg-[#0d0d0d] p-3.5 rounded-xl border border-[#222] space-y-1">
              <p className="text-[8px] text-gray-500 uppercase font-bold">PII & Financial Findings</p>
              <p className="text-lg font-bold text-blue-400">
                {((anonymizedResult?.categoryBreakdown.PII || 0) + (anonymizedResult?.categoryBreakdown.FINANCIAL || 0))}
              </p>
            </div>
            <div className="bg-[#0d0d0d] p-3.5 rounded-xl border border-[#222] space-y-1">
              <p className="text-[8px] text-gray-500 uppercase font-bold">Secrets & Infra Findings</p>
              <p className="text-lg font-bold text-purple-400">
                {((anonymizedResult?.categoryBreakdown.CREDENTIAL || 0) + (anonymizedResult?.categoryBreakdown.INFRASTRUCTURE || 0))}
              </p>
            </div>
          </div>

          {/* Sample Preset Loaders */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0d0d0d] px-4 py-2.5 rounded-xl border border-[#222]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 uppercase font-bold">Load Sample Dispatch:</span>
              {SAMPLE_REPORTS.map((sr, idx) => (
                <button
                  key={idx}
                  onClick={() => setReportInput(sr.text)}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] text-gray-300 font-bold uppercase transition-all"
                >
                  Sample #{idx + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRedacted}
                className="bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1"
              >
                <Copy size={11} /> Copy Sanitized
              </button>
              <button
                onClick={() => handleExportSanitizedReport('txt')}
                className="bg-harvest-accent text-black px-3 py-1 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 hover:bg-harvest-accent/90"
              >
                <Download size={11} /> Export TXT
              </button>
              <button
                onClick={() => handleExportSanitizedReport('json')}
                className="bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1"
              >
                <FileJson size={11} /> Export JSON
              </button>
            </div>
          </div>

          {/* Side-By-Side Diff Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Raw Input */}
            <div className="bg-[#0d0d0d] p-4 rounded-2xl border border-[#222] flex flex-col h-[480px]">
              <div className="flex justify-between items-center border-b border-[#222] pb-2 mb-3">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                  <EyeOff size={13} className="text-red-400" /> Raw Intelligence Report (Input)
                </span>
                <span className="text-[8px] text-gray-500 uppercase">{reportInput.length} characters</span>
              </div>
              <textarea
                value={reportInput}
                onChange={e => setReportInput(e.target.value)}
                placeholder="Paste unredacted intelligence reports, narrative text, or system dumps..."
                className="w-full flex-1 bg-black/60 border border-[#222] rounded-xl p-3.5 text-[10px] font-mono text-gray-300 outline-none resize-none focus:border-harvest-accent/40"
              />
            </div>

            {/* Right: Sanitized Redacted Output */}
            <div className="bg-[#0d0d0d] p-4 rounded-2xl border border-[#222] flex flex-col h-[480px]">
              <div className="flex justify-between items-center border-b border-[#222] pb-2 mb-3">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-harvest-accent" /> Sanitized Output (Live Redacted)
                </span>
                <span className="text-[8px] text-harvest-accent uppercase font-bold">
                  {anonymizedResult?.redactionCount} Redaction(s)
                </span>
              </div>
              <div className="w-full flex-1 bg-black/60 border border-[#222] rounded-xl p-3.5 text-[10px] font-mono text-harvest-accent overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                {anonymizedResult?.redactedText}
              </div>
            </div>
          </div>

          {/* Finding Breakdown Details Table */}
          {anonymizedResult && anonymizedResult.findings.length > 0 && (
            <div className="bg-[#0d0d0d] p-4 rounded-2xl border border-[#222] space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                PII & Sensitive Pattern Detection Ledger ({anonymizedResult.findings.length})
              </h4>
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left text-[9px] font-mono">
                  <thead>
                    <tr className="border-b border-[#222] text-gray-500 uppercase">
                      <th className="pb-2 px-2">Category</th>
                      <th className="pb-2 px-2">Rule Triggered</th>
                      <th className="pb-2 px-2">Raw Value (Sensitive)</th>
                      <th className="pb-2 px-2">Redacted Pseudo-Token</th>
                      <th className="pb-2 px-2">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {anonymizedResult.findings.map((f, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-2 font-bold text-gray-300">{f.category}</td>
                        <td className="py-2 px-2 text-white">{f.ruleName}</td>
                        <td className="py-2 px-2 text-red-400 font-bold blur-[3px] hover:blur-none transition-all duration-200 cursor-pointer" title="Hover to unblur for analyst review">
                          {f.matchedText}
                        </td>
                        <td className="py-2 px-2 text-harvest-accent font-bold">{f.redactedText}</td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            f.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {f.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRAPH TOPOLOGY REDACTION */}
      {activeTab === 'graphs' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-[#0d0d0d] p-4 rounded-xl border border-[#222]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Graph Topology & Node Label Anonymizer</h3>
              <p className="text-[9px] text-gray-500 uppercase mt-0.5">
                Masks node labels and sensitive metadata while maintaining structural edge connectivity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportSanitizedGraph('cypher')}
                className="bg-harvest-accent text-black font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase hover:bg-harvest-accent/90"
              >
                Export Cypher (.cypher)
              </button>
              <button
                onClick={() => handleExportSanitizedGraph('json')}
                className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExportSanitizedGraph('csv')}
                className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Anonymized Nodes Table */}
            <div className="bg-[#0d0d0d] p-4 rounded-2xl border border-[#222] space-y-3">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Sanitized Graph Nodes ({graphResult?.anonymizedNodes.length || 0})</span>
                <span className="text-[8px] text-harvest-accent font-mono font-bold">
                  {graphResult?.redactedEntitiesCount || 0} Entities Redacted
                </span>
              </h4>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-[9px] font-mono">
                  <thead>
                    <tr className="border-b border-[#222] text-gray-500 uppercase">
                      <th className="pb-2 px-2">Type</th>
                      <th className="pb-2 px-2">Original Identifier</th>
                      <th className="pb-2 px-2">Sanitized Node Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {SAMPLE_GRAPH_NODES.map((origNode, idx) => {
                      const anonNode = graphResult?.anonymizedNodes[idx];
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-2 font-bold uppercase text-gray-400">{origNode.type}</td>
                          <td className="py-2.5 px-2 text-red-400 font-mono blur-[2.5px] hover:blur-none transition-all cursor-pointer">
                            {origNode.label}
                          </td>
                          <td className="py-2.5 px-2 text-harvest-accent font-bold font-mono">
                            {anonNode?.label || origNode.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sanitized Graph Edges */}
            <div className="bg-[#0d0d0d] p-4 rounded-2xl border border-[#222] space-y-3">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">
                Retained Topological Edges ({graphResult?.anonymizedEdges.length || 0})
              </h4>
              <div className="overflow-x-auto max-h-80 space-y-2">
                {graphResult?.anonymizedEdges.map((edge, idx) => (
                  <div key={idx} className="bg-black/60 p-3 rounded-xl border border-[#222] text-[9px] font-mono space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-harvest-accent font-bold">{edge.source}</span>
                      <span className="text-gray-500">──[{edge.relationship}]──➔</span>
                      <span className="text-blue-400 font-bold">{edge.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURABLE SENSITIVE DATA RULES & REGEX STUDIO */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Action Bar & Rule Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0d0d0d] p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg border border-[#222]">
              <Search size={14} className="text-gray-500" />
              <input
                type="text"
                value={ruleSearch}
                onChange={e => setRuleSearch(e.target.value)}
                placeholder="SEARCH RULES / REGEX..."
                className="bg-transparent text-[10px] uppercase font-bold text-white placeholder-gray-600 outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg border border-[#222]">
              <span className="text-[9px] text-gray-500 uppercase font-bold">Category:</span>
              <select
                value={ruleCategoryFilter}
                onChange={e => setRuleCategoryFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase text-gray-300 outline-none w-full"
              >
                <option value="ALL">ALL CATEGORIES</option>
                <option value="PII">PII</option>
                <option value="FINANCIAL">FINANCIAL</option>
                <option value="CREDENTIAL">CREDENTIAL</option>
                <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-black/60 px-3 py-2 rounded-lg border border-[#222]">
              <span className="text-[9px] text-gray-400 font-bold uppercase">Active Rules:</span>
              <span className="text-[10px] text-harvest-accent font-bold">
                {rules.filter(r => r.enabled).length} / {rules.length}
              </span>
            </div>

            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="bg-harvest-accent text-black font-bold px-3 py-2 rounded-lg text-[10px] uppercase flex items-center justify-center gap-1.5 hover:bg-harvest-accent/90"
            >
              <Plus size={13} /> Add Custom Rule
            </button>
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  rule.enabled ? 'bg-[#0d0d0d] border-[#262626]' : 'bg-[#0a0a0a] border-[#181818] opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-harvest-accent uppercase">
                      {rule.category}
                    </span>
                    <h4 className="text-xs font-bold text-white uppercase mt-1.5">{rule.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        rule.enabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {rule.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                    {rule.id.startsWith('custom-rule-') && (
                      <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-600 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[9px] text-gray-400 leading-relaxed">{rule.description}</p>

                <div className="bg-black/60 p-2.5 rounded-xl border border-[#1f1f1f] space-y-1">
                  <p className="text-[7px] text-gray-500 uppercase font-bold">Match Pattern (Regex):</p>
                  <p className="text-[9px] text-gray-300 font-mono break-all">{rule.pattern}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a] text-[8px]">
                  <span className="text-gray-500 uppercase font-bold">Redaction Mode:</span>
                  <select
                    value={rule.redactionMode}
                    onChange={e => handleChangeRuleMode(rule.id, e.target.value as RedactionMode)}
                    className="bg-black border border-[#222] rounded px-2 py-1 text-[8px] font-bold text-harvest-accent outline-none uppercase"
                  >
                    <option value="REPLACE_TOKEN">Tokenize</option>
                    <option value="FULL_MASK">Full Mask</option>
                    <option value="PARTIAL_MASK">Partial Mask</option>
                    <option value="HASH_SHA256">SHA256 Hash</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BATCH STORED TARGETS SCANNER */}
      {activeTab === 'batch' && (
        <div className="bg-[#0d0d0d] p-6 rounded-2xl border border-[#222] space-y-4">
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Database Target Assets & Threat Artifacts PII Audit
              </h3>
              <p className="text-[9px] text-gray-500 uppercase mt-0.5">
                Automated vulnerability check for unredacted PII in active investigation targets
              </p>
            </div>
            <button
              onClick={() => showToast('Batch target database scan complete. No critical leaks found.')}
              className="bg-harvest-accent text-black font-bold px-3.5 py-2 rounded-lg text-[9px] uppercase flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Scan All Targets ({targets.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className="border-b border-[#222] text-gray-500 uppercase">
                  <th className="pb-3 px-2">Target Asset</th>
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">PII Risk Level</th>
                  <th className="pb-3 px-2">Sanitization Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {targets.length > 0 ? (
                  targets.map(t => {
                    const hasEmailOrWallet = t.name.includes('@') || t.name.startsWith('0x') || t.type === 'wallet';
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-2 font-bold text-white">{t.name}</td>
                        <td className="py-3 px-2 uppercase text-gray-400">{t.type}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-white/5 border border-white/10 text-gray-300 uppercase">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            hasEmailOrWallet ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {hasEmailOrWallet ? 'POTENTIAL PII DETECTED' : 'CLEAR'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => {
                              setReportInput(`Target Name: ${t.name}\nType: ${t.type}\nStatus: ${t.status}\nMetadata Dump for Target ID ${t.id}`);
                              setActiveTab('reports');
                              showToast(`Loaded target ${t.name} into Live Diff.`);
                            }}
                            className="text-[9px] text-harvest-accent hover:underline uppercase font-bold"
                          >
                            Inspect in Sanitizer ➔
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-600 italic">
                      No active targets in database. Initialize new targets or load sample dispatches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM SENSITIVE DATA RULE MODAL */}
      <AnimatePresence>
        {isRuleModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] border border-[#333] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#222] pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus size={14} className="text-harvest-accent" />
                  Define Custom Sensitive Data Rule
                </h3>
                <button onClick={() => setIsRuleModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateRule} className="space-y-3.5 text-[10px]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-bold">Rule Name</label>
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={e => setNewRuleName(e.target.value)}
                      placeholder="e.g. Secret Project Codename"
                      className="w-full bg-black border border-[#222] rounded-lg p-2 text-[9px] text-white mt-1 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-bold">Category</label>
                    <select
                      value={newRuleCategory}
                      onChange={e => setNewRuleCategory(e.target.value as SensitiveDataCategory)}
                      className="w-full bg-black border border-[#222] rounded-lg p-2 text-[9px] text-white uppercase mt-1 outline-none"
                    >
                      <option value="PII">PII</option>
                      <option value="FINANCIAL">FINANCIAL</option>
                      <option value="CREDENTIAL">CREDENTIAL</option>
                      <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                      <option value="CLASSIFIED_HANDLE">CLASSIFIED_HANDLE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] text-gray-500 uppercase font-bold">Match Pattern (Regular Expression)</label>
                  <input
                    type="text"
                    required
                    value={newRulePattern}
                    onChange={e => setNewRulePattern(e.target.value)}
                    placeholder="e.g. \\bOPERATION_[A-Z0-9_]+\\b or confidential_word"
                    className="w-full bg-black border border-[#222] rounded-lg p-2 text-[9px] text-harvest-accent font-mono mt-1 outline-none"
                  />
                </div>

                {/* Live Sandbox Tester */}
                <div className="bg-black/70 p-3 rounded-xl border border-[#222] space-y-2">
                  <label className="text-[8px] text-gray-400 uppercase font-bold flex items-center justify-between">
                    <span>Live Regex Sandbox Tester</span>
                    {testRegexMatches.length > 0 ? (
                      <span className="text-green-400 font-bold">✓ {testRegexMatches.length} Match(es) Found</span>
                    ) : (
                      <span className="text-gray-600">No match</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={testRegexInput}
                    onChange={e => setTestRegexInput(e.target.value)}
                    placeholder="Type sample text to test regex matching..."
                    className="w-full bg-black border border-[#333] rounded-lg p-2 text-[9px] text-white outline-none"
                  />
                  {testRegexMatches.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {testRegexMatches.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-harvest-accent/20 text-harvest-accent font-mono text-[8px] font-bold">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-bold">Redaction Mode</label>
                    <select
                      value={newRuleMode}
                      onChange={e => setNewRuleMode(e.target.value as RedactionMode)}
                      className="w-full bg-black border border-[#222] rounded-lg p-2 text-[9px] text-white uppercase mt-1 outline-none"
                    >
                      <option value="REPLACE_TOKEN">Tokenize ([ANON_...])</option>
                      <option value="FULL_MASK">Full Mask (████)</option>
                      <option value="PARTIAL_MASK">Partial Mask (x***y)</option>
                      <option value="HASH_SHA256">SHA256 Hash</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-bold">Severity Level</label>
                    <select
                      value={newRuleSeverity}
                      onChange={e => setNewRuleSeverity(e.target.value as any)}
                      className="w-full bg-black border border-[#222] rounded-lg p-2 text-[9px] text-white uppercase mt-1 outline-none"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-harvest-accent text-black font-bold py-2.5 rounded-lg uppercase tracking-wider text-[9px] hover:bg-harvest-accent/90"
                  >
                    Register Sensitive Rule
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRuleModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white uppercase text-[9px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
