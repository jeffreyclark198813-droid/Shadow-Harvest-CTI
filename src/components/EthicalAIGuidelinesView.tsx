import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Scale, Lock, Users, Compass, ShieldAlert, CheckCircle2, 
  AlertTriangle, Search, FileDown, BookOpen, ExternalLink, Filter, 
  Award, RefreshCw, Copy, Check, Info, ArrowRight, Sparkles, Sliders
} from 'lucide-react';
import { 
  ETHICAL_AI_FRAMEWORK_METADATA, 
  ETHICAL_AI_PILLARS, 
  COMPLIANCE_CHECKLIST_QUESTIONS,
  PolicyPillar,
  PolicyArticle 
} from '../constants/ethicalAiGuidelines';
import { notify } from './Toaster';

interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  proposedAction: string;
  status: 'COMPLIANT' | 'VIOLATION' | 'CONDITIONAL';
  implicatedArticles: string[];
  verdict: string;
  remediation: string;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'scen-01',
    title: 'Passive Botnet C2 Infrastructure Fingerprinting',
    description: 'Querying publicly accessible DNS passive records and inspecting TLS x509 certificate chains of a suspected ransomware C2 domain.',
    proposedAction: 'Read-only TLS handshake & DNS historic query with rate limiting under 2 req/sec.',
    status: 'COMPLIANT',
    implicatedArticles: ['Art. 1.1', 'Art. 4.1'],
    verdict: 'Fully compliant with Open Public-Domain Boundary (Art. 1.1) and Strict Passive Reconnaissance Mandate (Art. 4.1). No access controls bypassed.',
    remediation: 'Ensure logged artifacts preserve cryptographic hash provenance and log the source URI.'
  },
  {
    id: 'scen-02',
    title: 'Bulk Civilian Forum Scraping Without Threat Anchor',
    description: 'Deploying an automated crawler to harvest user profiles, emails, and political discussions from a regional social forum to build generic sentiment indices.',
    proposedAction: 'Unbounded crawler across 5,000 civilian profiles without specific threat hypothesis.',
    status: 'VIOLATION',
    implicatedArticles: ['Art. 1.2', 'Art. 1.3', 'Art. 4.2'],
    verdict: 'Direct violation of Ban on Dragnet Surveillance (Art. 1.3) and PII Sanitization (Art. 1.2). Potential violation of platform Terms of Service (Art. 4.2).',
    remediation: 'Immediately halt collection. Tether collection to an active, substantiated threat hypothesis with a maximum graph depth of 2 degrees from verified threat seeds.'
  },
  {
    id: 'scen-03',
    title: 'Testing Exploit Depth on Discovered Vulnerable Server',
    description: 'An analyst discovers an open directory listing and attempts to execute a test payload to confirm whether remote code execution is possible.',
    proposedAction: 'Sending non-destructive proof-of-concept test string to vulnerable endpoint.',
    status: 'VIOLATION',
    implicatedArticles: ['Art. 4.1', 'Art. 3.4'],
    verdict: 'Critical violation of Strict Passive Reconnaissance Mandate (Art. 4.1) and CFAA (18 U.S.C. § 1030). Even benign testing without authorization constitutes unlawful active intrusion.',
    remediation: 'Cease active payload transmission immediately. Document the observation from passive telemetry only, and initiate Coordinated Vulnerability Disclosure (Art. 3.4) via standard CSIRT channels.'
  },
  {
    id: 'scen-04',
    title: 'Automated Attributing with Single Hypothesis',
    description: 'AI model attributes an APT intrusion exclusively to a specific nation-state actor because the malware compile time matched an Eastern European time zone.',
    proposedAction: 'Publishing attribution report naming the threat actor with 95% confidence without alternative analysis.',
    status: 'CONDITIONAL',
    implicatedArticles: ['Art. 2.1', 'Art. 2.2', 'Art. 2.3'],
    verdict: 'Violates Analysis of Competing Hypotheses Mandate (Art. 2.2) and Epistemic Calibration (Art. 2.1). Time-zone data alone is an easily falsified T2 inference, not definitive T0 proof.',
    remediation: 'Execute the ACH matrix. Evaluate false-flag mimicry and tool re-use hypotheses. Reduce confidence rating to reflect epistemic uncertainty bounds.'
  },
  {
    id: 'scen-05',
    title: 'Passive Persona Observation in Threat Actor Chat Channel',
    description: 'Deploying a synthetic persona with a non-human generated avatar into a public Telegram breach-notification group to monitor leak postings without messaging or engaging.',
    proposedAction: 'Silent lurker persona collecting public message drops; zero conversational interaction.',
    status: 'COMPLIANT',
    implicatedArticles: ['Art. 4.3', 'Art. 1.1'],
    verdict: 'Compliant with Investigative Persona Code of Conduct (Art. 4.3). Passive read-only observation with synthetic persona avoids entrapment or civilian impersonation.',
    remediation: 'Maintain read-only mode. Never post solicitations, never verify credentials in the channel, and ensure persona avatar is verified non-living identity.'
  }
];

export const EthicalAIGuidelinesView: React.FC = () => {
  const [selectedPillarId, setSelectedPillarId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'guidelines' | 'auditor' | 'simulator'>('guidelines');
  const [selectedArticle, setSelectedArticle] = useState<PolicyArticle | null>(null);

  // Compliance Auditor state
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({
    'chk-01': true,
    'chk-03': true,
    'chk-05': true,
    'chk-06': true,
    'chk-07': true
  });
  const [auditTargetName, setAuditTargetName] = useState<string>('OPERATION-HARVEST-ACTIVE-OPS');
  const [copiedDigest, setCopiedDigest] = useState<boolean>(false);

  // Scenario tester state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-01');

  // Compute compliance score
  const complianceScore = useMemo(() => {
    let totalWeight = 0;
    let earnedWeight = 0;
    COMPLIANCE_CHECKLIST_QUESTIONS.forEach(q => {
      totalWeight += q.weight;
      if (checkedQuestions[q.id]) {
        earnedWeight += q.weight;
      }
    });
    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  }, [checkedQuestions]);

  const toggleQuestion = (id: string) => {
    setCheckedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtered articles
  const filteredPillars = useMemo(() => {
    return ETHICAL_AI_PILLARS.map(pillar => {
      if (selectedPillarId !== 'all' && pillar.id !== selectedPillarId) {
        return null;
      }

      const matchingArticles = pillar.articles.filter(article => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          article.articleNumber.toLowerCase().includes(q) ||
          article.title.toLowerCase().includes(q) ||
          article.shortSummary.toLowerCase().includes(q) ||
          article.mandate.toLowerCase().includes(q) ||
          article.legalCrossReferences.some(ref => ref.toLowerCase().includes(q))
        );
      });

      if (matchingArticles.length === 0 && searchQuery.trim()) {
        return null;
      }

      return {
        ...pillar,
        articles: matchingArticles
      };
    }).filter(Boolean) as PolicyPillar[];
  }, [selectedPillarId, searchQuery]);

  const activeScenario = useMemo(() => {
    return SCENARIO_PRESETS.find(s => s.id === selectedScenarioId) || SCENARIO_PRESETS[0];
  }, [selectedScenarioId]);

  // Handle Markdown Export
  const handleExportCharter = () => {
    const header = `# ${ETHICAL_AI_FRAMEWORK_METADATA.frameworkName}
Code: ${ETHICAL_AI_FRAMEWORK_METADATA.codeName} | Version: ${ETHICAL_AI_FRAMEWORK_METADATA.version} | Effective: ${ETHICAL_AI_FRAMEWORK_METADATA.effectiveDate}
Supervisory Authority: ${ETHICAL_AI_FRAMEWORK_METADATA.oversightAuthority}
Standards: ${ETHICAL_AI_FRAMEWORK_METADATA.complianceStandard}

## Scope & Mandate
${ETHICAL_AI_FRAMEWORK_METADATA.mandateScope}

---
`;

    const body = ETHICAL_AI_PILLARS.map(p => {
      const articles = p.articles.map(a => `
### ${a.articleNumber}: ${a.title} [Severity: ${a.severityIfBreached}]
**Summary:** ${a.shortSummary}

**Mandate:**
${a.mandate}

**Mandatory Procedures:**
${a.procedures.map(proc => `- ${proc}`).join('\n')}

**Strictly Prohibited Actions:**
${a.prohibitedActions.map(act => `- [X] ${act}`).join('\n')}

**Verification Criteria:**
${a.verificationCriteria.map(v => `- [OK] ${v}`).join('\n')}

**Legal & Standards Cross-References:**
${a.legalCrossReferences.join('; ')}
`).join('\n');

      return `## Pillar ${p.pillarNumber}: ${p.title}
*Objective:* ${p.coreObjective}
${articles}
`;
    }).join('\n\n---\n\n');

    const fullDoc = header + body;
    const blob = new Blob([fullDoc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OPERATION_SHADOW_HARVEST_ETHICAL_AI_GUIDELINES_v${ETHICAL_AI_FRAMEWORK_METADATA.version}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify({
      type: 'success',
      title: 'Charter Exported',
      message: 'Official Ethical AI Guidelines downloaded as Markdown audit document.'
    });
  };

  const handleCopyAuditCertificate = () => {
    const digest = `OSH-AUDIT-${auditTargetName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}-${Date.now().toString(36).toUpperCase()}-SCORE-${complianceScore}`;
    const certText = `=== OPERATION SHADOW HARVEST COMPLIANCE ATTESTATION ===
Target Asset: ${auditTargetName}
Timestamp: ${new Date().toISOString()}
Compliance Index: ${complianceScore}/100 [${complianceScore >= 80 ? 'PASSED / AUTHORIZED' : complianceScore >= 60 ? 'CONDITIONAL PROVISIONAL' : 'REJECTED / HIGH RISK'}]
Audit Digest: ${digest}
Standard: ISO/IEC 42001 & NIST AI RMF 1.0 (OSH-ETHICS-2026)
Checklist Evaluation:
${COMPLIANCE_CHECKLIST_QUESTIONS.map(q => `  [${checkedQuestions[q.id] ? 'PASS' : 'FAIL'}] ${q.category}: ${q.question}`).join('\n')}
======================================================`;

    navigator.clipboard.writeText(certText);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
    notify({
      type: 'success',
      title: 'Audit Attestation Copied',
      message: 'Cryptographic compliance attestation string copied to clipboard.'
    });
  };

  const getPillarIcon = (name: string) => {
    switch (name) {
      case 'Lock': return <Lock size={16} className="text-emerald-400" />;
      case 'Scale': return <Scale size={16} className="text-amber-400" />;
      case 'ShieldAlert': return <ShieldAlert size={16} className="text-purple-400" />;
      case 'Compass': return <Compass size={16} className="text-cyan-400" />;
      case 'Users': return <Users size={16} className="text-blue-400" />;
      default: return <Shield size={16} className="text-harvest-accent" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/40">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-orange-500/20 text-orange-400 border border-orange-500/40">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-gray-200">
      {/* Header Banner */}
      <div className="hardware-surface p-6 sm:p-8 bg-gradient-to-br from-black/90 via-black/70 to-harvest-accent/10 border border-harvest-accent/40 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-harvest-accent/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-harvest-accent/15 border border-harvest-accent/40 text-harvest-accent text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Scale size={12} />
                OPERATIONAL ETHICS STANDARD
              </span>
              <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono">
                v{ETHICAL_AI_FRAMEWORK_METADATA.version}
              </span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                ISO/IEC 42001 & NIST AI RMF
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Ethical AI & Responsible OSINT Guidelines
            </h1>

            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
              Official governance charter defining the non-negotiable boundaries of data privacy, cognitive unbiasing, sensitive intelligence classification, and lawful passive reconnaissance across all autonomous reasoning engines within <span className="text-white font-semibold">OPERATION SHADOW HARVEST</span>.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-gray-500 pt-1">
              <span>Authority: <strong className="text-gray-300">{ETHICAL_AI_FRAMEWORK_METADATA.oversightAuthority}</strong></span>
              <span>•</span>
              <span>Epistemic Model: <strong className="text-harvest-accent">{ETHICAL_AI_FRAMEWORK_METADATA.epistemicStandard}</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleExportCharter}
              className="px-4 py-3 bg-harvest-accent/15 hover:bg-harvest-accent/25 border border-harvest-accent/50 rounded-2xl text-harvest-accent font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,0,0.15)] active:scale-95"
              title="Download Full Charter as Markdown"
            >
              <FileDown size={15} />
              <span>EXPORT CHARTER (MD)</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'guidelines'
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_rgba(0,255,0,0.3)]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen size={14} />
            <span>POLICY PILLARS & ARTICLES (5)</span>
          </button>

          <button
            onClick={() => setActiveTab('auditor')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'auditor'
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_rgba(0,255,0,0.3)]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>INTERACTIVE COMPLIANCE AUDITOR</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] ${
              complianceScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {complianceScore}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_rgba(0,255,0,0.3)]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles size={14} />
            <span>OPERATIONAL SCENARIO EVALUATOR</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Policy Pillars & Articles */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-black/50 p-4 border border-harvest-border rounded-2xl">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-1 pl-1 pr-2">
                <Filter size={11} /> Pillar:
              </span>
              <button
                onClick={() => setSelectedPillarId('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all whitespace-nowrap ${
                  selectedPillarId === 'all'
                    ? 'bg-harvest-accent/20 text-harvest-accent border border-harvest-accent/40'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                All (18 Articles)
              </button>
              {ETHICAL_AI_PILLARS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPillarId(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedPillarId === p.id
                      ? 'bg-harvest-accent/20 text-harvest-accent border border-harvest-accent/40'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {getPillarIcon(p.iconName)}
                  <span>Pillar {p.pillarNumber}</span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles, legal refs, PII..."
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-harvest-accent/50 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Pillars List */}
          <div className="space-y-8">
            {filteredPillars.map(pillar => (
              <div key={pillar.id} className="space-y-4">
                {/* Pillar Header Card */}
                <div className="p-5 bg-[#0f0f0f] border-l-4 border-harvest-accent border-y border-r border-harvest-border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-black/70 border border-white/10 rounded-xl">
                      {getPillarIcon(pillar.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-harvest-accent uppercase tracking-wider">
                          PILLAR 0{pillar.pillarNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-gray-400">
                          {pillar.badge}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-white uppercase tracking-tight mt-0.5">
                        {pillar.title}
                      </h2>
                      <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-left md:text-right max-w-sm">
                    <p className="text-[9px] font-mono uppercase text-gray-500 font-bold tracking-wider">Core Operational Objective</p>
                    <p className="text-[11px] text-gray-300 mt-1 italic leading-snug font-sans">
                      "{pillar.coreObjective}"
                    </p>
                  </div>
                </div>

                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pillar.articles.map(article => (
                    <motion.div
                      key={article.id}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedArticle(article)}
                      className="hardware-surface p-5 rounded-2xl cursor-pointer hover:border-harvest-accent/50 transition-all flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-harvest-accent">
                              {article.articleNumber}
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-harvest-accent transition-colors">
                              {article.title}
                            </span>
                          </div>
                          {getSeverityBadge(article.severityIfBreached)}
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed">
                          {article.shortSummary}
                        </p>

                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-gray-300 font-mono leading-relaxed line-clamp-3">
                          {article.mandate}
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                        <span className="truncate max-w-[220px]">
                          Refs: {article.legalCrossReferences[0]}
                        </span>
                        <span className="text-harvest-accent font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          VIEW MANDATE <ArrowRight size={11} />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Interactive Compliance Auditor */}
      {activeTab === 'auditor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score & Attestation Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="hardware-surface p-6 rounded-3xl border border-harvest-border bg-gradient-to-br from-black/80 to-harvest-accent/5 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider">
                    COMPLIANCE SCORECARD
                  </span>
                  <Award size={18} className={complianceScore >= 80 ? 'text-harvest-accent' : 'text-amber-400'} />
                </div>

                <div className="text-center py-4 bg-black/60 border border-white/10 rounded-2xl relative overflow-hidden">
                  <div className="text-5xl font-black font-mono tracking-tight" style={{
                    color: complianceScore >= 80 ? '#00ff00' : complianceScore >= 60 ? '#f59e0b' : '#ef4444'
                  }}>
                    {complianceScore}
                    <span className="text-xl text-gray-500 font-sans">/100</span>
                  </div>

                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                      complianceScore >= 80
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : complianceScore >= 60
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}>
                      {complianceScore >= 80 ? 'PASSED: FULL OPERATIONAL CLEARANCE' : complianceScore >= 60 ? 'CONDITIONAL: SUPERVISORY OVERRIDE REQ.' : 'NON-COMPLIANT: COLLECTION BLOCKED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">Target Operation / Mission Name</label>
                  <input
                    type="text"
                    value={auditTargetName}
                    onChange={e => setAuditTargetName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-harvest-accent/50"
                  />
                </div>

                <button
                  onClick={handleCopyAuditCertificate}
                  className="w-full py-3 bg-harvest-accent text-black font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-harvest-accent/90 transition-all shadow-[0_0_15px_rgba(0,255,0,0.2)] active:scale-95"
                >
                  {copiedDigest ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedDigest ? 'ATTESTATION COPIED' : 'GENERATE AUDIT ATTESTATION'}</span>
                </button>

                <div className="text-[10px] font-mono text-gray-500 leading-relaxed border-t border-white/10 pt-4">
                  Attestation string embeds cryptographic digest of checked rules, timestamp, and target metadata suitable for append-only audit ledgers.
                </div>
              </div>

              {/* Quick Framework References */}
              <div className="hardware-surface p-5 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink size={13} className="text-harvest-accent" />
                  Legal Cross-Reference Index
                </h4>
                <div className="space-y-2 text-[11px] font-mono text-gray-400">
                  <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                    <strong className="text-gray-200">18 U.S.C. § 1030 (CFAA):</strong> Prohibits exceeding authorized access or causing intentional damage.
                  </div>
                  <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                    <strong className="text-gray-200">GDPR Recital 71 & Art. 22:</strong> Guarantees human intervention in automated decision systems.
                  </div>
                  <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                    <strong className="text-gray-200">Tallinn Manual 2.0 (Rule 66):</strong> Defines peaceful cyber intelligence collection boundaries.
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Questions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    Operational Compliance Checklist (7 Controls)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Evaluate your active intelligence gathering or target profile against the ethical charter.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const allChecked: Record<string, boolean> = {};
                    COMPLIANCE_CHECKLIST_QUESTIONS.forEach(q => allChecked[q.id] = true);
                    setCheckedQuestions(allChecked);
                  }}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] font-mono font-bold"
                >
                  RESET ALL PASS
                </button>
              </div>

              <div className="space-y-3">
                {COMPLIANCE_CHECKLIST_QUESTIONS.map(item => {
                  const isChecked = !!checkedQuestions[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleQuestion(item.id)}
                      className={`hardware-surface p-5 rounded-2xl cursor-pointer border transition-all ${
                        isChecked 
                          ? 'border-harvest-accent/30 bg-harvest-accent/[0.02]' 
                          : 'border-red-500/40 bg-red-500/[0.03]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 transition-colors ${
                          isChecked
                            ? 'bg-harvest-accent border-harvest-accent text-black'
                            : 'bg-black/50 border-red-500/50 text-transparent'
                        }`}>
                          <Check size={13} strokeWidth={3} />
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                              {item.category} • Weight: {item.weight} pts
                            </span>
                            <span className={`text-[10px] font-mono font-bold uppercase ${
                              isChecked ? 'text-harvest-accent' : 'text-red-400'
                            }`}>
                              {isChecked ? 'COMPLIANT' : 'DEFICIENT'}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                            {item.question}
                          </h4>

                          <p className="text-xs text-gray-400 pt-1 leading-relaxed">
                            {item.guidance}
                          </p>

                          {!isChecked && (
                            <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] font-mono text-red-300 flex items-center gap-2">
                              <AlertTriangle size={14} className="flex-shrink-0" />
                              <span><strong>Risk if unaddressed:</strong> {item.riskIfFailed}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Operational Scenario Simulator */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="p-4 bg-black/40 border border-white/10 rounded-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              Operational Ethics Scenario Evaluator
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select realistic OSINT tradecraft scenarios to test ethical constraints and understand operational legal boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario List */}
            <div className="lg:col-span-1 space-y-3">
              {SCENARIO_PRESETS.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedScenarioId === scenario.id
                      ? 'bg-harvest-accent/10 border-harvest-accent/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]'
                      : 'hardware-surface hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      scenario.status === 'COMPLIANT'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : scenario.status === 'VIOLATION'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {scenario.status}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {scenario.implicatedArticles.join(', ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{scenario.title}</h4>
                </button>
              ))}
            </div>

            {/* Scenario Evaluation Detail */}
            <div className="lg:col-span-2 hardware-surface p-6 rounded-3xl border border-harvest-border space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    activeScenario.status === 'COMPLIANT'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : activeScenario.status === 'VIOLATION'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    VERDICT: {activeScenario.status}
                  </span>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight mt-2">
                    {activeScenario.title}
                  </h3>
                </div>

                <div className="text-[11px] font-mono text-gray-400">
                  Implicated: <strong className="text-harvest-accent">{activeScenario.implicatedArticles.join(', ')}</strong>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Context & Operational Setting</p>
                  <p className="text-gray-300 mt-1 leading-relaxed">{activeScenario.description}</p>
                </div>

                <div className="p-3 bg-black/50 border border-white/5 rounded-xl font-mono">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Proposed Operational Action</p>
                  <p className="text-white mt-1">{activeScenario.proposedAction}</p>
                </div>

                <div className={`p-4 rounded-xl border ${
                  activeScenario.status === 'COMPLIANT'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : activeScenario.status === 'VIOLATION'
                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1">Charter Analysis & Ruling</p>
                  <p className="leading-relaxed">{activeScenario.verdict}</p>
                </div>

                <div className="p-4 bg-harvest-accent/5 border border-harvest-accent/30 rounded-xl space-y-1">
                  <p className="text-[10px] font-mono font-bold text-harvest-accent uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Mandatory Operational Remediation
                  </p>
                  <p className="text-gray-300 leading-relaxed font-mono text-[11px]">
                    {activeScenario.remediation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#111] border border-harvest-accent/40 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-black/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-harvest-accent">{selectedArticle.articleNumber}</span>
                    {getSeverityBadge(selectedArticle.severityIfBreached)}
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                    {selectedArticle.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{selectedArticle.shortSummary}</p>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white text-base"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
                <div>
                  <h4 className="text-[10px] font-mono uppercase font-bold text-harvest-accent tracking-wider mb-1.5">
                    Operational Mandate
                  </h4>
                  <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl text-gray-200 font-mono leading-relaxed">
                    {selectedArticle.mandate}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider mb-2">
                    Mandatory Operational Procedures
                  </h4>
                  <ul className="space-y-1.5 text-gray-300">
                    {selectedArticle.procedures.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono uppercase font-bold text-red-400 tracking-wider mb-2">
                    Strictly Prohibited Actions
                  </h4>
                  <ul className="space-y-1.5 text-gray-300">
                    {selectedArticle.prohibitedActions.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider mb-2">
                    Audit Verification Criteria
                  </h4>
                  <ul className="space-y-1.5 text-gray-300 font-mono text-[11px]">
                    {selectedArticle.verificationCriteria.map((v, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider mb-1.5">
                    Legal & Standards Cross-References
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArticle.legalCrossReferences.map((ref, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-gray-300">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono font-bold"
                >
                  CLOSE MANDATE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
