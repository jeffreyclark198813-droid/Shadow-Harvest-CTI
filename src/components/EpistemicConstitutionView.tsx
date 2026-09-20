import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Binary, Database, Link2, CheckCircle2, AlertTriangle, 
  HelpCircle, Layers, ArrowRight, Eye, RefreshCw, GitFork, 
  Sliders, FileText, Cpu, Scale, Search, Clock, Award, ShieldAlert,
  ChevronRight, Lock, Hash
} from 'lucide-react';
import { 
  EpistemicLevel, EvidenceClass, IntegrityStatus, EvidenceAtom, 
  CompetingHypothesis, MetricLineage 
} from '../types/atomic';

const EPISTEMIC_LEVELS: {
  level: EpistemicLevel;
  title: string;
  subtitle: string;
  color: string;
  description: string;
  allowedAssertions: string;
  forbidden: string;
}[] = [
  {
    level: 'T0',
    title: 'Observation',
    subtitle: 'Directly verified from identifiable source',
    color: 'emerald',
    description: 'Raw telemetry, DNS captures, network packets, WHOIS records, or unmodified TLS certificate handshakes.',
    allowedAssertions: 'Empirical facts directly witnessed in supplied or runtime artifacts.',
    forbidden: 'Must never contain analytical speculation, probabilistic correlation, or ungrounded assertions.'
  },
  {
    level: 'T1',
    title: 'Derivation',
    subtitle: 'Deterministic & reproducible transformation',
    color: 'cyan',
    description: 'Calculated metrics, spatial aggregations, parsed ASTs, hash digests, normalized schemas, and network topologies.',
    allowedAssertions: 'Reproducibly computed results from input T0 evidence with invariant algorithms.',
    forbidden: 'Must not introduce unverified heuristics or subjective confidence multipliers.'
  },
  {
    level: 'T2',
    title: 'Inference',
    subtitle: 'Probabilistic & correlational conclusions',
    color: 'amber',
    description: 'Stylometric matches, cluster proximity, behavioral anomaly scores, and threat attribution hypotheses.',
    allowedAssertions: 'Hypotheses with explicit uncertainty bounds, error bars, and alternate interpretations.',
    forbidden: 'Must never be reported as proven fact or unassailable certainty.'
  },
  {
    level: 'T3',
    title: 'Assessment',
    subtitle: 'Evidence-integrated analytical judgment',
    color: 'purple',
    description: 'Comprehensive intelligence estimates incorporating competing explanations, cognitive bias audits, and source reliability weighting.',
    allowedAssertions: 'Weighted analytical judgments contextualized with explicit caveats and intelligence gaps.',
    forbidden: 'Must not omit conflicting evidence or present one hypothesis to the exclusion of viable alternatives.'
  },
  {
    level: 'T4',
    title: 'Decision',
    subtitle: 'Authorized operational or policy consequence',
    color: 'red',
    description: 'Operational posture changes, automated firewall blocks, law enforcement referrals, or collection tasking orders.',
    allowedAssertions: 'Policy consequences directly traced back through verified T3 assessments to T0 observations.',
    forbidden: 'Cannot be enacted without complete verifiable provenance and appropriate analyst authorization.'
  }
];

const EVIDENCE_CLASSES: {
  name: EvidenceClass;
  meaning: string;
  permittedAssertion: string;
  badgeColor: string;
}[] = [
  {
    name: 'OBSERVED',
    meaning: 'Directly verified in supplied/runtime artifacts',
    permittedAssertion: 'Fact about the inspected artifact',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  },
  {
    name: 'DERIVED',
    meaning: 'Reproducibly calculated from observations',
    permittedAssertion: 'Computational result with documented formula lineage',
    badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
  },
  {
    name: 'INFERRED',
    meaning: 'Analytical interpretation or probabilistic model',
    permittedAssertion: 'Hypothesis/conclusion with quantified uncertainty',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10'
  },
  {
    name: 'ASSESSED',
    meaning: 'Analyst-integrated judgment across multi-source evidence',
    permittedAssertion: 'Evidence-weighted intelligence assessment with caveats',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10'
  },
  {
    name: 'PROPOSED',
    meaning: 'Design or implementation recommendation',
    permittedAssertion: 'Future-state specification or candidate hypothesis',
    badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10'
  },
  {
    name: 'UNKNOWN',
    meaning: 'Insufficient empirical evidence',
    permittedAssertion: 'Cannot presently be established (UNKNOWN ≠ FALSE)',
    badgeColor: 'border-zinc-600 text-zinc-400 bg-zinc-800/40'
  },
  {
    name: 'CONFLICTING',
    meaning: 'Evidence sources materially disagree',
    permittedAssertion: 'Requires deliberate analytical reconciliation',
    badgeColor: 'border-orange-500/40 text-orange-400 bg-orange-500/10'
  },
  {
    name: 'UNVERIFIED',
    meaning: 'Claimed externally but not independently established',
    permittedAssertion: 'Must not be treated as empirical ground truth',
    badgeColor: 'border-red-500/40 text-red-400 bg-red-500/10'
  }
];

const SAMPLE_ATOMS: EvidenceAtom[] = [
  {
    id: 'EVID-T0-98421',
    evidenceClass: 'OBSERVED',
    epistemicLevel: 'T0',
    sourceId: 'SRC-DNS-PDNS-01',
    sourceType: 'Passive DNS Sensor',
    observedAt: '2026-08-23T01:14:09Z',
    retrievedAt: '2026-08-23T01:15:00Z',
    collector: 'CTI-Ingest-Daemon-04',
    location: 'US-East-1',
    rawReference: 'A query shadow-harvest-c2.net -> 198.51.100.44',
    contentHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    parentEvidenceIds: [],
    transformationIds: [],
    confidence: 1.0,
    reliability: 'A1 (Completely Reliable / Confirmed)',
    integrityStatus: 'VERIFIED',
    accessClassification: 'TLP:GREEN',
    retentionPolicy: '90-Day Standard CTI Retain',
    claimText: 'Domain shadow-harvest-c2.net resolved to IP 198.51.100.44 at timestamp 2026-08-23T01:14:09Z'
  },
  {
    id: 'EVID-T1-41902',
    evidenceClass: 'DERIVED',
    epistemicLevel: 'T1',
    sourceId: 'SRC-MAXMIND-ASN-2026',
    sourceType: 'BGP/ASN Routing Table Derivation',
    observedAt: '2026-08-23T01:14:09Z',
    retrievedAt: '2026-08-23T01:15:30Z',
    collector: 'Topology-Derivation-Worker',
    rawReference: 'Route lookup 198.51.100.44/32 in BGP RIB table',
    contentHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    parentEvidenceIds: ['EVID-T0-98421'],
    transformationIds: ['TRANS-GEO-BGP-LOOKUP-V3'],
    confidence: 0.95,
    reliability: 'A2 (Reliable Source / Probably True)',
    integrityStatus: 'VERIFIED',
    accessClassification: 'TLP:GREEN',
    retentionPolicy: '90-Day Standard CTI Retain',
    claimText: 'IP 198.51.100.44 belongs to ASN AS64496 (Autonomous System Infrastructure Cluster 09)'
  },
  {
    id: 'EVID-T2-11048',
    evidenceClass: 'INFERRED',
    epistemicLevel: 'T2',
    sourceId: 'SRC-CORRELATION-ENGINE-V2',
    sourceType: 'Graph Relationship Inference',
    observedAt: '2026-08-23T01:16:00Z',
    retrievedAt: '2026-08-23T01:16:05Z',
    collector: 'Hypothesis-Engine-Antigravity',
    contentHash: 'sha256:ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    parentEvidenceIds: ['EVID-T0-98421', 'EVID-T1-41902'],
    transformationIds: ['TRANS-JACCARD-SIMILARITY-V2'],
    confidence: 0.82,
    reliability: 'B2 (Usually Reliable / Probably True)',
    integrityStatus: 'VERIFIED',
    accessClassification: 'TLP:AMBER',
    retentionPolicy: '180-Day Threat Investigation',
    claimText: 'Shared infrastructure overlaps with threat cluster THREAT-ACTOR-STORM-049 with 82% confidence'
  },
  {
    id: 'EVID-T3-05183',
    evidenceClass: 'ASSESSED',
    epistemicLevel: 'T3',
    sourceId: 'SRC-ANALYST-JCLARK',
    sourceType: 'Lead Intelligence Assessment',
    observedAt: '2026-08-23T01:45:00Z',
    retrievedAt: '2026-08-23T01:45:00Z',
    collector: 'Analyst Workstation // Certified Signoff',
    contentHash: 'sha256:185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969',
    parentEvidenceIds: ['EVID-T2-11048'],
    transformationIds: ['TRANS-EVID-INTEGRATION-V1'],
    confidence: 0.88,
    reliability: 'B1 (Usually Reliable / Confirmed by Analyst Integration)',
    integrityStatus: 'VERIFIED',
    accessClassification: 'TLP:AMBER',
    retentionPolicy: 'Permanent Investigation Record',
    claimText: 'Target infrastructure is staged for credential-harvesting campaign targeting defense contractors; competing hypothesis of shared bulletproof hosting is evaluated at 14% likelihood.'
  }
];

const COMPETING_HYPOTHESES: CompetingHypothesis[] = [
  {
    id: 'HYP-001',
    code: 'H1',
    title: 'Genuine Operational Relationship',
    description: 'Infrastructure is purposefully provisioned and operated by the identified threat cluster for active C2 routing.',
    probability: 0.74,
    supportingEvidenceIds: ['EVID-T0-98421', 'EVID-T1-41902', 'EVID-T2-11048'],
    falsificationCriteria: 'Evidence of distinct third-party registrant credentials or passive DNS overlap with unrelated legitimate entities.',
    status: 'supported'
  },
  {
    id: 'HYP-002',
    code: 'H2',
    title: 'Incidental Co-Location / IP Churn',
    description: 'Relationship is an artifact of dynamic IP reassignment or transient DHCP pool allocation without operational linkage.',
    probability: 0.12,
    supportingEvidenceIds: [],
    falsificationCriteria: 'Persistent DNS record holding over 72 consecutive hours with correlated custom TLS certificate fingerprints.',
    status: 'falsified'
  },
  {
    id: 'HYP-003',
    code: 'H3',
    title: 'Shared Multi-Tenant Bulletproof Hosting Provider',
    description: 'Unrelated threat actors independently rented virtual private servers within the same ASN hosting pool.',
    probability: 0.14,
    supportingEvidenceIds: ['EVID-T1-41902'],
    falsificationCriteria: 'Distinct SSH host key fingerprints and disparate TLS cipher negotiation ordering.',
    status: 'active'
  },
  {
    id: 'HYP-004',
    code: 'H4',
    title: 'Insufficient Evidence for Attribution',
    description: 'Observed telemetry is insufficient to establish beyond reasonable doubt that infrastructure is actor-controlled.',
    probability: 0.08,
    supportingEvidenceIds: [],
    falsificationCriteria: 'Corroboration from at least 3 independent collection vectors with Admiralty code B2 or higher.',
    status: 'inconclusive'
  }
];

const METRIC_LINEAGES: MetricLineage[] = [
  {
    metricName: 'Weighted Threat Intensity I(r,t)',
    formulaVersion: 'v2.4-epistemic',
    formulaDefinition: 'I(r,t) = Σ [ severity(e) * confidence(e) * recency_decay(e) * source_reliability(e) ]',
    numerator: 'Sum of weighted threat events within region r in time window t',
    denominator: 'Normalized baseline regional coefficient',
    unit: 'Intensity Index [0.0 - 100.0]',
    inputEvidenceIds: ['EVID-T0-98421', 'EVID-T1-41902'],
    calculationTimestamp: '2026-08-23T02:00:00Z',
    result: 78.4,
    uncertainty: 4.2,
    temporalWindow: 'Trailing 14 Days UTC'
  },
  {
    metricName: 'Connection Density D(G_target)',
    formulaVersion: 'v1.8-graph-invariant',
    formulaDefinition: 'D(G) = 2 * |E_observed| / ( |V| * (|V| - 1) )',
    numerator: '2 * Observed Relationship Edges (|E_obs| = 42)',
    denominator: 'Possible Edges across Defined Ontology Boundary (|V|=16 -> 240)',
    unit: 'Graph Density [0.0 - 1.0]',
    inputEvidenceIds: ['EVID-T1-41902', 'EVID-T2-11048'],
    calculationTimestamp: '2026-08-23T02:00:00Z',
    result: 0.35,
    uncertainty: 0.02,
    temporalWindow: 'Active Snapshot'
  },
  {
    metricName: 'Composite Correlation Strength S(A, B)',
    formulaVersion: 'v3.1-composite',
    formulaDefinition: 'S(A, B) = [ Evidence_Weight * Mean_Confidence * Source_Reliability ] * Temporal_Proximity_Factor',
    numerator: 'Attributed multi-vector overlap score',
    denominator: 'Max theoretical correlation ceiling',
    unit: 'Correlation Coefficient [0.0 - 1.0]',
    inputEvidenceIds: ['EVID-T0-98421', 'EVID-T2-11048'],
    calculationTimestamp: '2026-08-23T02:00:00Z',
    result: 0.83,
    uncertainty: 0.05,
    temporalWindow: 'Multi-year Historical Archive'
  }
];

export const EpistemicConstitutionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'classes' | 'atoms' | 'hypotheses' | 'metrics' | 'axioms'>('pipeline');
  const [selectedAtom, setSelectedAtom] = useState<EvidenceAtom>(SAMPLE_ATOMS[0]);
  const [selectedLevel, setSelectedLevel] = useState<EpistemicLevel>('T0');

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                Epistemic Constitution
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Specification 0.0 — Scientific Invariants
              </span>
            </div>
            <h1 className="text-xl font-bold text-white uppercase tracking-tight">
              Evidence-Controlled Analytical Workbench
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              Preserving the non-negotiable distinction between Observation (T0), Derivation (T1), Inference (T2), 
              Assessment (T3), and Decision (T4). No lower epistemic state silently inherits the authority of a higher state.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg flex-shrink-0">
            <Shield className="text-emerald-400" size={24} />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Integrity Policy</div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Zero-Unverified-Promotion</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-zinc-800/80 text-xs">
          {[
            { id: 'pipeline', label: 'T0-T4 Canonical Pipeline', icon: GitFork },
            { id: 'classes', label: 'Evidence Classification', icon: Layers },
            { id: 'atoms', label: 'Atomic Evidence & Provenance', icon: Database },
            { id: 'hypotheses', label: 'Competing Hypotheses & Falsification', icon: Scale },
            { id: 'metrics', label: 'Scientific Measurement Lineage', icon: Sliders },
            { id: 'axioms', label: 'Epistemic Axioms & Invariants', icon: Lock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT 1: CANONICAL PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {EPISTEMIC_LEVELS.map((item, idx) => {
              const isSelected = selectedLevel === item.level;
              return (
                <div
                  key={item.level}
                  onClick={() => setSelectedLevel(item.level)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/60 ring-2 ring-emerald-500/20'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.level === 'T0' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      item.level === 'T1' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      item.level === 'T2' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      item.level === 'T3' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {item.level}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Stage 0{idx + 1}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase">{item.title}</h3>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{item.subtitle}</p>
                </div>
              );
            })}
          </div>

          {/* Selected Stage Deep-Dive */}
          {(() => {
            const stage = EPISTEMIC_LEVELS.find(s => s.level === selectedLevel)!;
            return (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-emerald-400 font-mono">{stage.level}</span>
                    <div>
                      <h2 className="text-base font-bold text-white uppercase tracking-tight">{stage.title} Deep Dive</h2>
                      <p className="text-xs text-zinc-400">{stage.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest border border-zinc-800 px-3 py-1.5 rounded-lg bg-zinc-900">
                    Epistemic Isolation Tier // Non-Mutating
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Database size={14} className="text-emerald-400" />
                      Domain Characterization
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
                      {stage.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Permitted Assertions
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg">
                      {stage.allowedAssertions}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      Prohibited Invariants
                    </h4>
                    <p className="text-xs text-red-300/90 leading-relaxed bg-red-500/5 border border-red-500/20 p-3 rounded-lg">
                      {stage.forbidden}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">CHAIN INVARIANT:</span>
                    <span>SOURCE ➔ T0 (Obs) ➔ T1 (Deriv) ➔ T2 (Infer) ➔ T3 (Assess) ➔ T4 (Decide)</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 uppercase">Provenance Strictly Cryptographically Signed</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT 2: EVIDENCE CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every artifact in the intelligence ecosystem carries an explicit evidence class. 
              The system will <strong className="text-white">never convert "PROPOSED", "INFERRED", or "UNVERIFIED"</strong> material 
              into "OBSERVED" status merely because it appears in a specification or report artifact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EVIDENCE_CLASSES.map(cls => (
              <div key={cls.name} className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono border ${cls.badgeColor}`}>
                    {cls.name}
                  </span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">Evidence Class</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Operational Meaning</h4>
                  <p className="text-xs text-zinc-200">{cls.meaning}</p>
                </div>
                <div className="pt-2 border-t border-zinc-800/60">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Permitted Assertion Boundary</h4>
                  <p className="text-[11px] text-zinc-400 italic">"{cls.permittedAssertion}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ATOMIC EVIDENCE & PROVENANCE TRAVERSAL */}
      {activeTab === 'atoms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Atoms */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="uppercase font-bold tracking-wider">Atomic Records ({SAMPLE_ATOMS.length})</span>
              <span className="text-[10px] text-zinc-600">SHA-256 Validated</span>
            </div>

            {SAMPLE_ATOMS.map(atom => {
              const isSelected = selectedAtom.id === atom.id;
              return (
                <div
                  key={atom.id}
                  onClick={() => setSelectedAtom(atom)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/60 ring-1 ring-emerald-500/20'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{atom.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      atom.epistemicLevel === 'T0' ? 'bg-emerald-500/20 text-emerald-400' :
                      atom.epistemicLevel === 'T1' ? 'bg-cyan-500/20 text-cyan-400' :
                      atom.epistemicLevel === 'T2' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {atom.epistemicLevel} • {atom.evidenceClass}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {atom.claimText}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-600 pt-1">
                    <span>{atom.collector}</span>
                    <span className="text-emerald-400/80">{atom.integrityStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Atom Detail & Provenance Chain Inspection */}
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-mono">{selectedAtom.id}</h3>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                    {selectedAtom.accessClassification}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Source: {selectedAtom.sourceId} ({selectedAtom.sourceType})</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  {selectedAtom.integrityStatus}
                </span>
                <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  Reliability: {selectedAtom.reliability.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Claim Text */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Analytical Claim</span>
              <p className="text-xs text-white leading-relaxed font-sans">{selectedAtom.claimText}</p>
            </div>

            {/* Technical Provenance Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[9px] text-zinc-500 uppercase block">Observed Timestamp</span>
                <span className="text-zinc-200 font-mono">{selectedAtom.observedAt}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[9px] text-zinc-500 uppercase block">Ingest Collector</span>
                <span className="text-zinc-200 font-mono">{selectedAtom.collector}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[9px] text-zinc-500 uppercase block">Confidence Score</span>
                <span className="text-emerald-400 font-mono font-bold">{(selectedAtom.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[9px] text-zinc-500 uppercase block">Retention Policy</span>
                <span className="text-zinc-200 font-mono">{selectedAtom.retentionPolicy}</span>
              </div>
            </div>

            {/* Cryptographic Content Hash */}
            <div className="bg-black/60 p-3 rounded-lg border border-zinc-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 overflow-hidden">
                <Hash size={14} className="text-emerald-500 flex-shrink-0" />
                <span className="text-zinc-500 font-mono text-[10px]">CONTENT_HASH:</span>
                <span className="text-zinc-300 font-mono text-[10px] truncate">{selectedAtom.contentHash}</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex-shrink-0">
                SHA-256 PASS
              </span>
            </div>

            {/* Provenance Invariant Traversal Lineage */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Link2 size={14} className="text-emerald-400" />
                Provenance Lineage Traversal (Claim ➔ Derivation ➔ Input Evidence ➔ Source)
              </h4>

              <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Terminal Analytical Claim</span>
                    <span className="text-xs font-bold text-white">{selectedAtom.id} ({selectedAtom.evidenceClass})</span>
                  </div>
                </div>

                <div className="pl-3 border-l-2 border-dashed border-zinc-800 ml-3 py-1">
                  <span className="text-[10px] text-zinc-600 font-mono">
                    Applied Transformations: {selectedAtom.transformationIds.length > 0 ? selectedAtom.transformationIds.join(', ') : 'None (Atomic T0 Ingest)'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Parent Input Evidence Artifacts</span>
                    <span className="text-xs text-zinc-300 font-mono">
                      {selectedAtom.parentEvidenceIds.length > 0 ? selectedAtom.parentEvidenceIds.join(' ➔ ') : 'Direct Primary Source Origin'}
                    </span>
                  </div>
                </div>

                <div className="pl-3 border-l-2 border-dashed border-zinc-800 ml-3 py-1">
                  <span className="text-[10px] text-zinc-600 font-mono">Source Origin: {selectedAtom.sourceId}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Physical Retrieval & Collection Event</span>
                    <span className="text-xs text-zinc-300 font-mono">{selectedAtom.collector} @ {selectedAtom.retrievedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: COMPETING HYPOTHESES & FALSIFICATION */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale size={16} className="text-amber-400" />
              Analysis of Competing Hypotheses (ACH) Framework
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every major intelligence claim is represented alongside competing explanations. 
              The system <strong className="text-white">will not encode correlation as certainty</strong> merely because one hypothesis is visually prominent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPETING_HYPOTHESES.map(hyp => (
              <div key={hyp.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-bold text-xs">
                      {hyp.code}
                    </span>
                    <h4 className="text-xs font-bold text-white uppercase">{hyp.title}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    hyp.status === 'supported' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    hyp.status === 'falsified' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                    hyp.status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {hyp.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{hyp.description}</p>

                {/* Probability Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono">Assessed Probability</span>
                    <span className="font-mono font-bold text-white">{(hyp.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        hyp.status === 'supported' ? 'bg-emerald-500' :
                        hyp.status === 'falsified' ? 'bg-red-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${hyp.probability * 100}%` }}
                    />
                  </div>
                </div>

                {/* Falsification Criteria */}
                <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-bold text-red-400/90 uppercase tracking-wider block">
                    Falsification Requirement
                  </span>
                  <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                    "{hyp.falsificationCriteria}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: SCIENTIFIC MEASUREMENT LINEAGE */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-cyan-400" />
              Scientific Metric Lineage & Reproducibility Matrix
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every quantitative score exposes its versioned formula, numerator, denominator, temporal window, and uncertainty bound. 
              A numerical score without calculation lineage is analytically incomplete.
            </p>
          </div>

          <div className="space-y-4">
            {METRIC_LINEAGES.map((metric, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-4 hover:border-zinc-700 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">{metric.metricName}</h4>
                    <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{metric.formulaDefinition}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                      {metric.formulaVersion}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400 font-mono">{metric.result}</span>
                      <span className="text-[10px] text-zinc-500 font-mono ml-1">± {metric.uncertainty}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Numerator Specification</span>
                    <p className="text-zinc-300 font-mono text-[11px]">{metric.numerator}</p>
                  </div>

                  <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Denominator Specification</span>
                    <p className="text-zinc-300 font-mono text-[11px]">{metric.denominator}</p>
                  </div>

                  <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Temporal Window & Unit</span>
                    <p className="text-zinc-300 font-mono text-[11px]">{metric.temporalWindow} ({metric.unit})</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: EPISTEMIC AXIOMS */}
      {activeTab === 'axioms' && (
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock size={16} className="text-emerald-400" />
              Section 52: The Epistemic Non-Negotiables
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              «No observation shall be promoted to derivation, no derivation to inference, no inference to assessment, 
              and no assessment to decision without an explicit evidentiary transition, reproducible transformation, 
              provenance chain, uncertainty representation, and appropriate authorization.»
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { axiom: 'UNKNOWN ≠ FALSE', meaning: 'Absence of observed telemetry does not constitute proof of negative.' },
              { axiom: 'CORRELATED ≠ OBSERVED', meaning: 'Statistical or graph correlation cannot substitute for direct empirical observation.' },
              { axiom: 'OBSERVED CHANGE ≠ MALICIOUS ACTIVITY', meaning: 'Infrastructure drift must not be reflexively classified as threat posture.' },
              { axiom: 'SEARCH RESULT ≠ VERIFIED FACT', meaning: 'External web search grounding constitutes unverified external claims.' },
              { axiom: 'MODEL OUTPUT ≠ GROUND TRUTH', meaning: 'Generative and probabilistic model outputs are strictly T2 inference signals.' },
              { axiom: 'VISUALIZATION ≠ EVIDENCE', meaning: 'A rendering is a presentation state, not an authoritative evidentiary artifact.' },
              { axiom: 'AGGREGATION ≠ OBSERVATION', meaning: 'Heatmap density and cluster sums are T1 derived artifacts.' },
              { axiom: 'SPECIFICATION ≠ IMPLEMENTATION', meaning: 'A capability remains UNVERIFIED until runtime codebase artifacts establish it.' }
            ].map((ax, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1.5">
                <div className="text-emerald-400 font-bold font-mono text-xs">{ax.axiom}</div>
                <div className="text-zinc-400 text-[11px] leading-relaxed">{ax.meaning}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
