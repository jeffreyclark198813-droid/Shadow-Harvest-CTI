import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Scale, 
  Database, 
  Binary, 
  Lock, 
  Cpu, 
  Radio, 
  Network, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  GitBranch, 
  Activity, 
  Layers, 
  Server, 
  Search, 
  Eye, 
  RefreshCw, 
  BookOpen, 
  Sliders, 
  Hash, 
  Clock, 
  Share2, 
  BarChart3, 
  ChevronRight, 
  Key, 
  Sparkles, 
  Info,
  Compass,
  Zap
} from 'lucide-react';

export const UniversalGovSecFrameworkView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [sampleClaim, setSampleClaim] = useState({
    statement: "T-Mobile signaling upstream trunk uses TLSv1.3 with SRTP media encryption",
    authorization: "Investigation Permitted (Agency Mandate AG-2026-SEC-09)",
    evidenceSupplied: "Observed SIP-TLS handshake & X.509 cert validation on port 5061",
    epistemicState: "T2",
    confidenceScore: 0.88,
  });

  const [similarityWeights, setSimilarityWeights] = useState({
    lexical: 0.20,
    semantic: 0.25,
    entity: 0.25,
    structural: 0.10,
    temporal: 0.10,
    source: 0.10
  });

  const [quantInputs, setQuantInputs] = useState({
    successfulIntervals: 1420,
    totalIntervals: 1440,
    answeredCalls: 480,
    attemptedCalls: 512,
    lostPackets: 14,
    expectedPackets: 25000,
    pddInviteMs: 120,
    pddProvMs: 245,
    cst200OkMs: 410,
    authFailures: 3,
    authAttempts: 520,
    observedLatencyMs: 412,
    historicalP50Ms: 21
  });

  // Calculate Quantitative Metrics
  const registrationAvailability = ((quantInputs.successfulIntervals / Math.max(1, quantInputs.totalIntervals)) * 100).toFixed(2);
  const asr = ((quantInputs.answeredCalls / Math.max(1, quantInputs.attemptedCalls)) * 100).toFixed(2);
  const packetLoss = ((quantInputs.lostPackets / Math.max(1, quantInputs.expectedPackets)) * 100).toFixed(4);
  const pdd = quantInputs.pddProvMs - quantInputs.pddInviteMs;
  const cst = quantInputs.cst200OkMs - quantInputs.pddInviteMs;
  const afr = ((quantInputs.authFailures / Math.max(1, quantInputs.authAttempts)) * 100).toFixed(2);
  const latencyRatio = (quantInputs.observedLatencyMs / Math.max(1, quantInputs.historicalP50Ms)).toFixed(2);

  const sections = [
    { id: 'overview', label: '0. Master Framework', icon: Shield },
    { id: 'epistemic', label: '1. Epistemic Control (T0–T4)', icon: Scale },
    { id: 'data_fabric', label: '2. UGSIDF Pipeline', icon: Layers },
    { id: 'atomic_model', label: '3. Atomic Data Model', icon: Binary },
    { id: 'dedup_matching', label: '4. Deduplication & Matching', icon: Hash },
    { id: 'telecom_pjsip', label: '5. Telecom & PJSIP Subsystem', icon: Radio },
    { id: 'osint_opsec', label: '6. OSINT & OPSEC Control Plane', icon: Eye },
    { id: 'analytics_math', label: '7. Quantitative Analytics & Anomaly', icon: BarChart3 },
    { id: 'correlation_claims', label: '8. Claim Graph & Provenance', icon: GitBranch },
    { id: 'carrier_profile', label: '9. Universal Carrier Profile', icon: Server },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="hardware-surface p-6 relative overflow-hidden bg-gradient-to-br from-black/80 via-black/60 to-harvest-accent/5 border border-harvest-accent/30 rounded-3xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-harvest-accent/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-harvest-accent/15 border border-harvest-accent/50 text-harvest-accent rounded-full text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={12} />
                UGSIDF SPECIFICATION V4.2
              </span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full text-[10px] font-mono uppercase tracking-widest">
                UNCLASSIFIED / OPEN
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              UNIVERSAL GOVSEC–OSINT–OPSEC–DATA INTELLIGENCE RECONSOLIDATION FRAMEWORK
            </h1>
            
            <p className="text-xs text-gray-400 font-mono max-w-4xl leading-relaxed">
              Evidence-Preserving, Provenance-Controlled, Privacy-Governed, Carrier-Agnostic, Multi-Domain Intelligence Architecture.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="px-3 py-1.5 bg-black/60 border border-harvest-border rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-harvest-accent animate-pulse" />
              <span className="text-[10px] font-mono text-gray-300">SCIENTIFIC INVARIANT: <strong className="text-harvest-accent">ENFORCED</strong></span>
            </div>
            <span className="text-[9px] font-mono text-gray-500">Traceable · Reproducible · Auditable</span>
          </div>
        </div>

        {/* Analytical Posture Chips */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-[10px] font-mono text-gray-400">
          <span className="text-harvest-accent font-bold uppercase">Analytical Posture:</span>
          {['evidence-first', 'reproducible', 'provenance-preserving', 'standards-controlled', 'privacy-governed', 'authorization-aware', 'statistically testable', 'continuously auditable'].map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-white/[0.03] border border-white/10 rounded-md text-gray-300">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-harvest-border">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-harvest-accent text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]' 
                  : 'bg-black/40 border border-harvest-border text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-black' : 'text-harvest-accent'} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Fundamental Transformation Axiom Card */}
            <div className="hardware-surface p-5 border border-yellow-500/30 bg-yellow-500/[0.02] rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-yellow-400" />
                <h3 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">
                  CRITICAL EPISTEMIC AXIOM & GOVERNING RULE
                </h3>
              </div>
              <div className="p-4 bg-black/60 border border-yellow-500/20 rounded-xl font-mono text-xs text-center text-white space-y-2">
                <p className="text-harvest-accent font-bold tracking-widest text-sm">
                  OBSERVATION &nbsp;≠&nbsp; INFERENCE &nbsp;≠&nbsp; HYPOTHESIS &nbsp;≠&nbsp; AUTHORIZATION &nbsp;≠&nbsp; FACT
                </p>
                <p className="text-[11px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Capability authorization, analytical inference, and factual verification are three separate states. 
                  A system may be authorized to investigate a proposition without treating that proposition as established fact.
                </p>
              </div>
            </div>

            {/* Master Architecture & Data Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 hardware-surface p-5 space-y-4">
                <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Database size={15} className="text-harvest-accent" />
                  MASTER DATA OBJECTIVE: UNIFIED DATA FABRIC (UGSIDF)
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Consolidates heterogeneous public, governmental, and legitimately authorized private datasets into an atomic, 
                  deduplicated, provenance-preserving analytical fabric.
                </p>

                {/* Pipeline Flow Visualization */}
                <div className="space-y-2 pt-2">
                  {[
                    { step: '01', name: 'SOURCE ECOSYSTEM', desc: 'Public OSINT, Gov Records, Standards/RFCs, Private Datasets, SIP/SDP/RTP, DNS/TLS' },
                    { step: '02', name: 'ACQUISITION + CRYPTO PROVENANCE', desc: 'SHA-256 Digesting, Immutable Evidence Vault, Authority & Scope Tagging' },
                    { step: '03', name: 'ATOMIC EXTRACTION & NORMALIZATION', desc: 'Semantic atomization, Field canonicalization without destroying raw datum' },
                    { step: '04', name: 'DETERMINISTIC & PROBABILISTIC MATCHING', desc: 'Exact hash match + 6-dimensional composite semantic similarity scoring' },
                    { step: '05', name: 'ENTITY RESOLUTION & CONFLICT RECONCILIATION', desc: 'Canonical entity persistent IDs, evidentiary precedence tree' },
                    { step: '06', name: 'REFERENTIAL INTEGRITY & CLAIM GRAPH', desc: 'Orphan/dangling cycle checks, explainable DAG reasoning chain' },
                    { step: '07', name: 'EVIDENCE-GRADED DECISION SUPPORT', desc: 'T0–T4 graded intelligence for GovSec, Defense & Cyber Incident Response' }
                  ].map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-black/40 border border-white/5 rounded-xl hover:border-harvest-accent/30 transition-all">
                      <span className="w-7 h-7 rounded-lg bg-harvest-accent/10 border border-harvest-accent/30 text-harvest-accent font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                        {p.step}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-tight">{p.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{p.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Domains Multi-Panel */}
              <div className="space-y-4">
                <div className="hardware-surface p-5 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                    <Layers size={14} className="text-harvest-accent" />
                    UNIFIED DATA DOMAINS
                  </h3>
                  
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl">
                      <p className="text-harvest-accent font-bold text-[11px]">DOMAIN A: OPEN OSINT</p>
                      <p className="text-[10px] text-gray-400 mt-1">Regulatory filings, corporate disclosures, public DNS/TLS, certs, geospatial data, repos, archives.</p>
                    </div>

                    <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl">
                      <p className="text-blue-400 font-bold text-[11px]">DOMAIN B: AUTHORIZED PRIVATE</p>
                      <p className="text-[10px] text-gray-400 mt-1">Enterprise flow metadata, auth logs, telecom CDRs, config artifacts, security incident response data.</p>
                    </div>

                    <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl">
                      <p className="text-purple-400 font-bold text-[11px]">DOMAIN C: TECHNICAL TELEMETRY</p>
                      <p className="text-[10px] text-gray-400 mt-1">SIP signaling, SDP media descriptors, RTP jitter/loss, Asterisk PJSIP states, TLS cipher suites.</p>
                    </div>
                  </div>
                </div>

                <div className="hardware-surface p-4 border border-harvest-accent/20 bg-harvest-accent/[0.02] space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-harvest-accent" />
                    <span className="text-[11px] font-mono font-bold text-white uppercase">RECONSOLIDATED END STATE</span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                    Every claim remains traceable to the evidence, method, assumptions, and transformation operations that produced it.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 1. SCIENTIFIC EPISTEMIC CONTROL */}
        {activeSection === 'epistemic' && (
          <motion.div
            key="epistemic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Scale size={16} className="text-harvest-accent" />
                FIVE-STATE SCIENTIFIC EVIDENCE ONTOLOGY (T0–T4)
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Mandatory epistemic state assignment ensures analytical honesty and prevents treating unverified claims or investigatory authorizations as established facts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                {[
                  { state: 'T0', name: 'Observation', def: 'Directly observed artifact, measurement, record, packet, document, or event', perm: 'Empirical datum', color: 'border-green-500 text-green-400 bg-green-500/10' },
                  { state: 'T1', name: 'Standards-derived', def: 'Supported by authoritative technical standards/documentation (RFC, ITU-T, 3GPP)', perm: 'Technical proposition', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                  { state: 'T2', name: 'Dependency-derived', def: 'Requires external authoritative source, authorized dataset, provisioning record, or live telemetry', perm: 'Pending authoritative validation', color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' },
                  { state: 'T3', name: 'Analytical inference', def: 'Derived through explicit analytical reasoning from T0–T2', perm: 'Model-derived conclusion', color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
                  { state: 'T4', name: 'Testable proposition', def: 'Plausible proposition lacking sufficient evidence', perm: 'Investigation target', color: 'border-red-500 text-red-400 bg-red-500/10' },
                ].map((item) => (
                  <div key={item.state} className={`p-4 rounded-2xl border ${item.color} flex flex-col justify-between space-y-3`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black font-mono">{item.state}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 border border-current">{item.perm}</span>
                      </div>
                      <h4 className="text-xs font-bold font-mono mt-1 text-white uppercase">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-2 leading-relaxed">{item.def}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Claim State & Epistemic Transformation Inspector */}
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Terminal size={15} className="text-harvest-accent" />
                INTERACTIVE EPISTEMIC CLAIM STATE TRANSFORMER
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">Investigation Claim Statement</label>
                    <input 
                      type="text" 
                      value={sampleClaim.statement} 
                      onChange={e => setSampleClaim({ ...sampleClaim, statement: e.target.value })}
                      className="w-full mt-1 bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-harvest-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">Authority Basis / Permitted Scope</label>
                    <input 
                      type="text" 
                      value={sampleClaim.authorization} 
                      onChange={e => setSampleClaim({ ...sampleClaim, authorization: e.target.value })}
                      className="w-full mt-1 bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-harvest-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">Supplied Evidence / Artifact</label>
                    <input 
                      type="text" 
                      value={sampleClaim.evidenceSupplied} 
                      onChange={e => setSampleClaim({ ...sampleClaim, evidenceSupplied: e.target.value })}
                      className="w-full mt-1 bg-black/50 border border-harvest-border rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-harvest-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">Epistemic State Assignment</label>
                    <div className="flex gap-2 mt-1">
                      {['T0', 'T1', 'T2', 'T3', 'T4'].map(t => (
                        <button
                          key={t}
                          onClick={() => setSampleClaim({ ...sampleClaim, epistemicState: t })}
                          className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                            sampleClaim.epistemicState === t 
                              ? 'bg-harvest-accent text-black border-harvest-accent' 
                              : 'bg-black/40 border-harvest-border text-gray-400 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Epistemic Evaluation Output */}
                <div className="bg-black/60 border border-harvest-border rounded-2xl p-4 font-mono text-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-[10px] text-gray-500 uppercase">FORMAL EPISTEMIC RECORD</span>
                      <span className="text-[10px] text-harvest-accent uppercase">STATUS: AUTHORIZATION ≠ FACT</span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <p><strong className="text-gray-500">CLAIM:</strong> <span className="text-white font-bold">"{sampleClaim.statement}"</span></p>
                      <p><strong className="text-gray-500">AUTHORIZATION:</strong> <span className="text-blue-400">{sampleClaim.authorization}</span></p>
                      <p><strong className="text-gray-500">EVIDENCE:</strong> <span className="text-green-400">{sampleClaim.evidenceSupplied}</span></p>
                      <p><strong className="text-gray-500">EPISTEMIC STATE:</strong> <span className="px-2 py-0.5 bg-white/10 text-harvest-accent rounded font-bold">{sampleClaim.epistemicState}</span></p>
                      <p><strong className="text-gray-500">NEXT EVIDENCE NEEDED:</strong> <span className="text-yellow-400">Carrier provisioning / observed SIP-TLS session / authoritative documentation</span></p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-gray-400">
                    <span className="text-harvest-accent font-bold">Rule:</span> Authorization grants lawful investigation rights but does not establish physical reality.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. UGSIDF DATA FABRIC */}
        {activeSection === 'data_fabric' && (
          <motion.div
            key="data_fabric"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Layers size={16} className="text-harvest-accent" />
                RAW → CANONICAL DATA LINEAGE ENGINE
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                No transformation destroys the original datum. Cryptographic digests, acquisition metadata, and source lineage are immutably preserved at each transformation step.
              </p>

              <div className="p-4 bg-black/60 border border-harvest-border rounded-2xl overflow-x-auto">
                <div className="flex items-center justify-between min-w-[700px] text-center font-mono text-xs">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 w-36">
                    <p className="text-harvest-accent font-bold text-[10px]">RAW ARTIFACT</p>
                    <p className="text-[9px] text-gray-400">Original bytes / text</p>
                    <p className="text-[8px] text-gray-600 truncate">SHA-256 Digest</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 w-36">
                    <p className="text-blue-400 font-bold text-[10px]">LEXICAL FORM</p>
                    <p className="text-[9px] text-gray-400">Tokenized Stream</p>
                    <p className="text-[8px] text-gray-600">Encoding Normalized</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 w-36">
                    <p className="text-yellow-400 font-bold text-[10px]">SEMANTIC ATOMS</p>
                    <p className="text-[9px] text-gray-400">Atomic Claims</p>
                    <p className="text-[8px] text-gray-600">Field-Level Values</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 w-36">
                    <p className="text-purple-400 font-bold text-[10px]">CANONICAL FORM</p>
                    <p className="text-[9px] text-gray-400">Harmonized Schema</p>
                    <p className="text-[8px] text-gray-600">Parent Pointers</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                  <div className="p-3 bg-harvest-accent/15 border border-harvest-accent/50 rounded-xl space-y-1 w-40">
                    <p className="text-harvest-accent font-bold text-[10px]">ANALYTICAL CLAIM</p>
                    <p className="text-[9px] text-white">Graded Assessment</p>
                    <p className="text-[8px] text-harvest-accent/80">Audit Traceable</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict Precedence Hierarchy */}
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <CheckCircle2 size={16} className="text-harvest-accent" />
                EVIDENTIARY PRECEDENCE HIERARCHY FOR CONFLICT RECONCILIATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 font-mono text-[10px] text-center">
                {[
                  { rank: '1', title: 'DIRECT OBSERVATION', desc: 'Live packet capture, raw sensor', prio: 'HIGHEST' },
                  { rank: '2', title: 'AUTHORITATIVE PRIMARY', desc: 'Carrier provisioning record, Gov filing', prio: 'HIGH' },
                  { rank: '3', title: 'REPRODUCIBLE MEASUREMENT', desc: 'Active ping, synthetic probe', prio: 'ELEVATED' },
                  { rank: '4', title: 'AUTHORITATIVE STANDARD', desc: 'RFC, 3GPP, ITU-T spec', prio: 'MEDIUM' },
                  { rank: '5', title: 'CORROBORATED SECONDARY', desc: 'Multi-source OSINT match', prio: 'CORROBORATED' },
                  { rank: '6', title: 'ANALYTICAL INFERENCE', desc: 'ML/Statistical model result', prio: 'INFERRED' },
                  { rank: '7', title: 'TESTABLE PROPOSITION', desc: 'Hypothesis pending validation', prio: 'LOWEST' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1 flex flex-col justify-between">
                    <span className="w-5 h-5 mx-auto rounded-full bg-white/10 font-bold text-white flex items-center justify-center text-[9px]">{item.rank}</span>
                    <p className="font-bold text-white text-[9px] mt-1">{item.title}</p>
                    <p className="text-gray-400 text-[8px] leading-tight">{item.desc}</p>
                    <span className="text-[8px] text-harvest-accent font-bold pt-1">{item.prio}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. ATOMIC DATA MODEL */}
        {activeSection === 'atomic_model' && (
          <motion.div
            key="atomic_model"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Binary size={16} className="text-harvest-accent" />
                  CANONICAL ATOMIC EVIDENCE OBJECT SCHEMA
                </h3>
                <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  IMMUTABLE LOGICAL EVIDENCE OBJECT
                </span>
              </div>

              <div className="p-4 bg-black/80 border border-harvest-border rounded-2xl font-mono text-xs overflow-x-auto text-gray-300">
                <pre className="text-green-400">
{`{
  "record_id": "8f3d1b7a-9c42-4f33-b789-32d849b109e2",
  "dataset_id": "UGSIDF-SEC-2026-USWEST",
  "entity_id": "ENTITY-000184",
  "claim_id": "CLAIM-SIP-TRANSPORT-09",

  "domain": "TELECOMMUNICATIONS",
  "subdomain": "SIP",

  "field": "transport.protocol",
  "raw_value": "\${TMO_SIP_TRANSPORT}",
  "canonical_value": "tls",

  "source": {
    "source_id": "SRC-PJSIP-CONF-441",
    "source_type": "USER_SUPPLIED_CONFIGURATION",
    "authority": "PROVISIONING_TEMPLATE_RFC3261",
    "retrieved_at": "2026-08-23T03:40:54Z",
    "observed_at": "2026-08-23T03:40:54Z"
  },

  "epistemic_state": "T2",

  "confidence": {
    "overall": 0.88,
    "source": 0.92,
    "directness": 0.85,
    "freshness": 0.95,
    "reproducibility": 0.90,
    "independence": 0.80,
    "consistency": 0.86
  },

  "relationships": {
    "supports": ["CLAIM-SRTP-MEDIA-SECURITY"],
    "contradicts": ["CLAIM-LEGACY-UDP-5060"],
    "depends_on": ["ENTITY-TRUNK-TMO-PRIMARY"],
    "supersedes": ["RECORD-CHAN-SIP-PEER-OLD"],
    "superseded_by": [],
    "duplicates": []
  },

  "reconciliation": {
    "status": "VALIDATED",
    "method": "PJSIP_CONFIG_PARSER_V3",
    "decision": "CANONICAL_MATCH",
    "decision_basis": ["RFC3261_SECTION_18", "TMO_INTERCONNECT_SPEC"]
  },

  "integrity": {
    "schema": "VALID",
    "references": "VALID",
    "provenance": "VALID"
  },

  "security": {
    "access_class": "AUTHORIZED",
    "privacy_class": "GOVERNED",
    "credential_material": false
  },

  "audit": {
    "created": "2026-08-23T03:40:54Z",
    "modified": "2026-08-23T03:40:54Z",
    "revision": 1,
    "change_set": ["INITIAL_ATOMIC_EXTRACTION"]
  }
}`}
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. DEDUPLICATION & PROBABILISTIC MATCHING */}
        {activeSection === 'dedup_matching' && (
          <motion.div
            key="dedup_matching"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deterministic Deduplication Card */}
              <div className="hardware-surface p-5 space-y-3">
                <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Hash size={15} className="text-harvest-accent" />
                  DETERMINISTIC DEDUPLICATION HASH MATRIX
                </h3>
                <p className="text-xs text-gray-400">
                  Exact duplicates are marked with relational pointers rather than destructively deleted.
                </p>
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-gray-300 space-y-1.5">
                  <p className="text-harvest-accent font-bold">Composite Deduplication Hash =</p>
                  <p className="text-white text-[11px]">SHA-256(raw_artifact)</p>
                  <p className="text-gray-400">+ canonicalized_content_hash</p>
                  <p className="text-gray-400">+ source_identifier</p>
                  <p className="text-gray-400">+ record_identifier</p>
                  <p className="text-gray-400">+ parameter_path</p>
                  <p className="text-gray-400">+ version</p>
                </div>
              </div>

              {/* Probabilistic Matching Weight Tuner */}
              <div className="hardware-surface p-5 space-y-3">
                <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Sliders size={15} className="text-harvest-accent" />
                  PROBABILISTIC MATCHING CALIBRATOR (M)
                </h3>
                <p className="text-xs text-gray-400">
                  Composite similarity score formula: <code className="text-harvest-accent font-mono">M = ∑ wᵢ · sᵢ</code>
                </p>

                <div className="space-y-2 pt-2 text-xs font-mono">
                  {Object.entries(similarityWeights).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 capitalize w-24">{key}:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="0.5" 
                        step="0.05"
                        value={val}
                        onChange={e => setSimilarityWeights({ ...similarityWeights, [key]: parseFloat(e.target.value) })}
                        className="flex-1 accent-harvest-accent h-1 bg-gray-800 rounded"
                      />
                      <span className="text-harvest-accent w-10 text-right font-bold">{val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 5. TELECOM & PJSIP FORENSIC SUBSYSTEM */}
        {activeSection === 'telecom_pjsip' && (
          <motion.div
            key="telecom_pjsip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Radio size={16} className="text-harvest-accent" />
                ASTERISK PJSIP 6-OBJECT RELATIONSHIP FORENSIC MODEL
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Asterisk's documented PJSIP architecture separates endpoint, AOR, auth, transport, registration, and identification objects.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2 font-mono text-xs text-center">
                {[
                  { name: 'TRANSPORT', desc: 'Protocols: UDP, TCP, TLS; Bind Address, Ciphers, Port (5060/5061)' },
                  { name: 'ENDPOINT', desc: 'Core signaling entity, codec policies, DTMF, encryption settings' },
                  { name: 'AUTH', desc: 'MD5/SHA256 digest authentication, user/pass credentials' },
                  { name: 'AOR', desc: 'Address of Record, contact URI, max contacts, qualification' },
                  { name: 'IDENTIFY', desc: 'Associates incoming IP addresses / subnets with specific endpoint' },
                  { name: 'REGISTRATION', desc: 'Outbound carrier registration client_uri, server_uri' },
                ].map((obj, i) => (
                  <div key={i} className="p-3 bg-black/50 border border-harvest-accent/30 rounded-xl space-y-2 flex flex-col justify-between">
                    <span className="w-6 h-6 mx-auto rounded-lg bg-harvest-accent/15 text-harvest-accent font-bold flex items-center justify-center text-[10px]">
                      {i + 1}
                    </span>
                    <h4 className="text-white font-bold text-[11px] uppercase tracking-tight">{obj.name}</h4>
                    <p className="text-[10px] text-gray-400 leading-tight">{obj.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Pipeline */}
            <div className="hardware-surface p-5 space-y-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                <CheckCircle2 size={14} className="text-harvest-accent" />
                PJSIP CONFIGURATION & INTEROPERABILITY VALIDATION STAGES
              </h3>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                {[
                  '1. CONFIG PARSE',
                  '2. OBJECT EXISTENCE',
                  '3. REFERENCE RESOLUTION',
                  '4. TRANSPORT VALIDATION',
                  '5. AUTH VALIDATION',
                  '6. AOR VALIDATION',
                  '7. IDENTIFY VALIDATION',
                  '8. REGISTRATION VALIDATION',
                  '9. DIALPLAN VALIDATION',
                  '10. LIVE INTEROP TEST'
                ].map((step, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-black/60 border border-harvest-border rounded-xl text-gray-300">
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 6. OSINT & OPSEC CONTROL PLANE */}
        {activeSection === 'osint_opsec' && (
          <motion.div
            key="osint_opsec"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* OSINT Acquisition Fabric */}
              <div className="hardware-surface p-5 space-y-3">
                <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Eye size={15} className="text-harvest-accent" />
                  12-STAGE OSINT ACQUISITION FABRIC
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300">
                  {[
                    '1. DISCOVERY',
                    '2. SOURCE REGISTRATION',
                    '3. AUTHENTICITY AUDIT',
                    '4. ACQUISITION',
                    '5. CRYPTO HASHING',
                    '6. PARSING',
                    '7. NORMALIZATION',
                    '8. ENTITY EXTRACTION',
                    '9. TEMPORAL INDEXING',
                    '10. CROSS-SOURCE CORRELATION',
                    '11. EVIDENCE GRADING',
                    '12. DECISION SUPPORT'
                  ].map((s, idx) => (
                    <div key={idx} className="p-2 bg-black/40 border border-white/5 rounded-lg">
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* OPSEC 7-Question Metadata Gate */}
              <div className="hardware-surface p-5 space-y-3">
                <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Lock size={15} className="text-harvest-accent" />
                  OPSEC CONTROL PLANE METADATA LAYER
                </h3>
                <p className="text-xs text-gray-400">
                  Every sensitive processing action evaluates the 7 operational security vectors:
                </p>
                <div className="space-y-1.5 text-xs font-mono">
                  {[
                    { q: 'WHO', a: 'Authenticated Analyst Persona & Identity' },
                    { q: 'WHAT', a: 'Specific artifact or intelligence segment requested' },
                    { q: 'WHEN', a: 'Timestamped access session window' },
                    { q: 'WHERE', a: 'Security perimeter, enclave, or network boundary' },
                    { q: 'WHY', a: 'Mission mandate, incident ticket ID, or investigation order' },
                    { q: 'HOW', a: 'Transformation / transmission method & cipher suite' },
                    { q: 'WITH WHAT AUTHORITY', a: 'Statutory or legal authorization code' },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded-lg">
                      <span className="text-harvest-accent font-bold text-[10px]">{row.q}</span>
                      <span className="text-gray-300 text-[10px]">{row.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 7. QUANTITATIVE ANALYTICS & ANOMALY DETECTION */}
        {activeSection === 'analytics_math' && (
          <motion.div
            key="analytics_math"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <BarChart3 size={16} className="text-harvest-accent" />
                QUANTITATIVE TELECOM & SECURITY METRIC CALCULATOR
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-black/60 border border-harvest-border rounded-xl text-center">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Registration Avail (Ar)</p>
                  <p className="text-base font-mono font-bold text-harvest-accent mt-1">{registrationAvailability}%</p>
                  <p className="text-[8px] font-mono text-gray-600">intervals / total</p>
                </div>

                <div className="p-3 bg-black/60 border border-harvest-border rounded-xl text-center">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Answer-Seizure (ASR)</p>
                  <p className="text-base font-mono font-bold text-blue-400 mt-1">{asr}%</p>
                  <p className="text-[8px] font-mono text-gray-600">answered / attempted</p>
                </div>

                <div className="p-3 bg-black/60 border border-harvest-border rounded-xl text-center">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Packet Loss (L)</p>
                  <p className="text-base font-mono font-bold text-yellow-400 mt-1">{packetLoss}%</p>
                  <p className="text-[8px] font-mono text-gray-600">lost / expected * 100</p>
                </div>

                <div className="p-3 bg-black/60 border border-harvest-border rounded-xl text-center">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Post-Dial Delay (PDD)</p>
                  <p className="text-base font-mono font-bold text-purple-400 mt-1">{pdd} ms</p>
                  <p className="text-[8px] font-mono text-gray-600">t_prov - t_INVITE</p>
                </div>

                <div className="p-3 bg-black/60 border border-harvest-border rounded-xl text-center">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Call Setup (CST)</p>
                  <p className="text-base font-mono font-bold text-emerald-400 mt-1">{cst} ms</p>
                  <p className="text-[8px] font-mono text-gray-600">t_200OK - t_INVITE</p>
                </div>

                <div className="p-3 bg-black/60 border border-harvest-border rounded-xl text-center">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Auth Failure (AFR)</p>
                  <p className="text-base font-mono font-bold text-red-400 mt-1">{afr}%</p>
                  <p className="text-[8px] font-mono text-gray-600">fails / attempts</p>
                </div>
              </div>
            </div>

            {/* Anomaly Detection Statistical Engine */}
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Activity size={16} className="text-harvest-accent" />
                HISTORICAL BASELINE ANOMALY DETECTION ENGINE
              </h3>
              
              <div className="p-4 bg-black/60 border border-white/10 rounded-2xl font-mono text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-gray-500">Historical OPTIONS Latency Baseline (p50):</span>
                    <strong className="text-white ml-2">{quantInputs.historicalP50Ms} ms</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Observed Latency:</span>
                    <strong className="text-red-400 ml-2">{quantInputs.observedLatencyMs} ms</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Calculated Deviation Ratio:</span>
                    <strong className="text-harvest-accent ml-2">{latencyRatio}x</strong>
                  </div>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-[11px]">
                  <strong>Analytical Verdict:</strong> Observed latency is approximately <span className="font-bold underline">{latencyRatio} times</span> the historical p50 baseline. Anomaly flag elevated for investigation.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 8. CLAIM GRAPH & PROVENANCE */}
        {activeSection === 'correlation_claims' && (
          <motion.div
            key="correlation_claims"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <GitBranch size={16} className="text-harvest-accent" />
                EXPLAINABLE CLAIM GRAPH & TEMPORAL DEPENDENCY DAG
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                The correlation engine distinguishes between Correlation, Causal Hypothesis, and Causal Evidence. Every analytical conclusion becomes an inspectable graph node.
              </p>

              {/* Correlation Chain Flow */}
              <div className="space-y-3 pt-2">
                {[
                  { event: 'DNS RECORD MODIFICATION', type: 'T0 OBSERVATION', time: 'T+00:00', detail: 'SRV _sip._tls.domain points to 198.51.100.44' },
                  { event: 'NEW SIGNALING ADDRESS MAPPED', type: 'T1 DERIVED', time: 'T+00:02', detail: 'Reverse PTR and ASN correlation matches upstream edge carrier' },
                  { event: 'SIP REGISTER TIMEOUT / FAILURE', type: 'T0 OBSERVATION', time: 'T+00:05', detail: '408 Request Timeout after 3x INVITE retransmissions' },
                  { event: 'CALL SETUP FAILURE CASCADE', type: 'T3 INFERENCE', time: 'T+00:06', detail: 'ASR drops below operational SLA threshold' },
                  { event: 'INCIDENT ADVISORY GENERATED', type: 'DECISION SUPPORT', time: 'T+00:07', detail: 'Actionable carrier remediation ticket auto-dispatched' }
                ].map((node, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl hover:border-harvest-accent/30 transition-all">
                    <span className="text-[10px] font-mono font-bold text-gray-500 w-16">{node.time}</span>
                    <span className="w-2 h-2 rounded-full bg-harvest-accent" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-mono font-bold text-white uppercase">{node.event}</h4>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-harvest-accent">{node.type}</span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">{node.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 9. UNIVERSAL CARRIER PROFILE */}
        {activeSection === 'carrier_profile' && (
          <motion.div
            key="carrier_profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Server size={16} className="text-harvest-accent" />
                PARAMETERIZED CARRIER ADAPTER SPECIFICATION
              </h3>
              <p className="text-xs text-gray-400">
                Carrier-specific parameters remain abstracted from the core evidence ontology.
              </p>

              <div className="p-4 bg-black/80 border border-harvest-border rounded-2xl font-mono text-xs overflow-x-auto text-yellow-400">
                <pre>
{`carrier:
  canonical_id: TMO
  name: T-Mobile

service:
  service_id: "\${SERVICE_ID}"
  sip_profile: "\${SIP_PROFILE}"

transport:
  protocol: "\${SIP_TRANSPORT}"        # e.g., tls, tcp, udp
  port: "\${SIP_PORT}"                    # e.g., 5061, 5060

routing:
  registrar: "\${SIP_REGISTRAR}"
  proxy: "\${SIP_PROXY}"
  networks: "\${SIP_NETWORKS}"

authentication:
  method: "\${AUTH_METHOD}"              # userpass, ip, certificate
  username: "\${SIP_USERNAME}"
  realm: "\${SIP_REALM}"

media:
  codecs: "\${CODEC_POLICY}"            # g711u, g711a, g722, opus
  dtmf: "\${DTMF_POLICY}"                # rfc4733
  encryption: "\${MEDIA_SECURITY_POLICY}"# srtp_sdes, dtls_srtp`}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
