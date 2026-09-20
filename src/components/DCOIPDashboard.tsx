import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  Layers, 
  GitBranch, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Radio, 
  Search, 
  FileText, 
  Sliders, 
  RefreshCw,
  Terminal,
  Activity,
  Award,
  Globe,
  SlidersHorizontal
} from 'lucide-react';

export const DCOIPDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dag' | 'artifacts' | 'epistemics' | 'exceptions' | 'certificate'>('dag');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('ART-8849-RAW');
  const [filterModality, setFilterModality] = useState<string>('all');

  const artifactsList = [
    {
      id: 'ART-8849-RAW',
      parentId: null,
      sourceId: 'SRC-SIP-GATEWAY-01',
      sourceType: 'LIVE_SIP_STREAM',
      modality: 'SIP',
      schema: 'CanonicalEventEnvelope',
      schemaVersion: 'v2.4.0',
      acquisitionTime: '2026-08-31T22:14:02Z',
      observationTime: '2026-08-31T22:14:02.104Z',
      integrityHash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      parser: 'PJSIPParserEngine',
      parserVersion: '4.2.1',
      softwareVersion: 'v2.10.4-prod',
      authorizationState: 'AUTHORIZED_ACTIVE',
      provenanceState: 'IMMUTABLE_PRESERVED',
      qualityState: 'VALID',
      syntheticState: 'OBSERVED_LIVE',
      confidence: 1.0,
      uncertainty: 0.0,
      retentionPolicy: 'PERMANENT_GOVSEC'
    },
    {
      id: 'ART-8850-DER',
      parentId: 'ART-8849-RAW',
      sourceId: 'SRC-SIP-GATEWAY-01',
      sourceType: 'TRANSACTION_GRAPH',
      modality: 'SIP',
      schema: 'DialogGraphSchema',
      schemaVersion: 'v2.4.0',
      acquisitionTime: '2026-08-31T22:14:05Z',
      observationTime: '2026-08-31T22:14:05.112Z',
      integrityHash: 'sha256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      parser: 'DialogGraphBuilder',
      parserVersion: '1.8.0',
      softwareVersion: 'v2.10.4-prod',
      authorizationState: 'AUTHORIZED_ACTIVE',
      provenanceState: 'DERIVED_IMMUTABLE',
      qualityState: 'VALID',
      syntheticState: 'DERIVED_FROM_OBSERVED',
      confidence: 0.96,
      uncertainty: 0.04,
      retentionPolicy: 'PERMANENT_GOVSEC'
    },
    {
      id: 'ART-8851-AUD',
      parentId: 'ART-8849-RAW',
      sourceId: 'SRC-MIC-ARRAY-04',
      sourceType: 'AUDIO_STREAM',
      modality: 'AUDIO',
      schema: 'WaveformFeatureVector',
      schemaVersion: 'v1.2.0',
      acquisitionTime: '2026-08-31T22:15:00Z',
      observationTime: '2026-08-31T22:15:00.540Z',
      integrityHash: 'sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      parser: 'SpectralOnsetExtractor',
      parserVersion: '3.1.0',
      softwareVersion: 'v2.10.4-prod',
      authorizationState: 'AUTHORIZED_SECURE',
      provenanceState: 'IMMUTABLE_PRESERVED',
      qualityState: 'VALID',
      syntheticState: 'OBSERVED_LIVE',
      confidence: 0.94,
      uncertainty: 0.06,
      retentionPolicy: 'AUDIT_90_DAYS'
    }
  ];

  const filteredArtifacts = filterModality === 'all' 
    ? artifactsList 
    : artifactsList.filter(a => a.modality.toLowerCase() === filterModality.toLowerCase());

  const selectedArtifact = artifactsList.find(a => a.id === selectedArtifactId) || artifactsList[0];

  return (
    <div className="space-y-6 bg-harvest-card/40 border border-harvest-border rounded-3xl p-6 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-harvest-border">
        <div>
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-harvest-accent animate-pulse" />
            DCOIP-X // UCM-LEX v∞ Lossless Provenance & Epistemic Audit Control Plane
          </h2>
          <p className="text-[11px] font-mono text-gray-400 mt-1">
            Machine-compact implementation spec enforcing lossless data science, immutability, provenance tracing, and epistemic separation (T0–T4).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab('dag')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'dag' 
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_#00ff00]' 
                : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <GitBranch size={13} />
            <span>Canonical DAG</span>
          </button>

          <button
            onClick={() => setActiveSubTab('artifacts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'artifacts' 
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_#00ff00]' 
                : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Database size={13} />
            <span>Atomic Artifacts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('epistemics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'epistemics' 
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_#00ff00]' 
                : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Epistemic T0-T4</span>
          </button>

          <button
            onClick={() => setActiveSubTab('exceptions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'exceptions' 
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_#00ff00]' 
                : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Waiver & Exceptions</span>
          </button>

          <button
            onClick={() => setActiveSubTab('certificate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'certificate' 
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_#00ff00]' 
                : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Award size={13} />
            <span>Release Cert</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'dag' && (
        <div className="space-y-6 font-mono">
          <div className="bg-black/60 border border-harvest-border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GitBranch size={16} className="text-harvest-accent" />
              Canonical Data DAG & Lineage Flow
            </h3>
            <p className="text-[11px] text-gray-400">
              Every data transformation preserves cryptographic lineage hashes and guarantees parent-child recoverability without evidence destruction.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              {[
                { step: 'T0', name: 'RAW_SOURCE', desc: 'Immutable raw data capture & hash validation', status: 'PASS' },
                { step: 'T1', name: 'NORMALIZED', desc: 'Canonical schema envelope wrapping', status: 'PASS' },
                { step: 'T2', name: 'DERIVED_FEATURES', desc: 'Spectral, transactional & geospatial features', status: 'PASS' },
                { step: 'T3', name: 'ASSESSMENTS', desc: 'Calibrated models & cross-modal correlation', status: 'PASS' },
              ].map((node, i) => (
                <div key={i} className="bg-black/80 border border-white/10 rounded-xl p-3.5 space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    {node.status}
                  </div>
                  <span className="text-[10px] text-harvest-accent font-bold">{node.step}</span>
                  <h4 className="text-xs font-bold text-white">{node.name}</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{node.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/60 border border-harvest-border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-harvest-accent" />
              Lossless Deduplication & Modality Abstraction Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2">
                <span className="text-harvest-accent font-bold">DEDUPLICATION ENGINE</span>
                <p className="text-gray-400 text-[11px]">Classifies transmissions into Retransmissions, Repeated Legitimate Events, and Distinct Events without evidence deletion.</p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2">
                <span className="text-harvest-accent font-bold">MODALITY ADAPTERS</span>
                <p className="text-gray-400 text-[11px]">Network, Audio, SIP, Geo, RTP/RTCP adapters convert raw feeds into canonical event envelopes without core analytical rewrites.</p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2">
                <span className="text-harvest-accent font-bold">ZERO-LOSS REPROCESSING</span>
                <p className="text-gray-400 text-[11px]">Old results are retained when new algorithm versions are applied, ensuring 100% reproducible historical lineage.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'artifacts' && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Filter Modality:</span>
              <select
                value={filterModality}
                onChange={(e) => setFilterModality(e.target.value)}
                className="bg-black/50 border border-harvest-border rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-harvest-accent"
              >
                <option value="all">All Modalities</option>
                <option value="sip">SIP</option>
                <option value="audio">Audio</option>
                <option value="network">Network</option>
              </select>
            </div>
            <span className="text-xs text-harvest-accent font-bold">{filteredArtifacts.length} Immutable Artifacts Loaded</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              {filteredArtifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifactId(art.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedArtifactId === art.id 
                      ? 'bg-harvest-accent/15 border-harvest-accent text-white shadow-[0_0_15px_rgba(0,255,0,0.1)]' 
                      : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{art.id}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-harvest-accent font-bold">{art.modality}</span>
                  </div>
                  <p className="text-[11px] text-gray-300">{art.sourceType}</p>
                  <span className="text-[9px] text-gray-500 block mt-1">Hash: {art.integrityHash.substring(0, 18)}...</span>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2 bg-black/60 border border-harvest-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-harvest-border">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">{selectedArtifact.id} - Schema Inspector</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Schema: {selectedArtifact.schema} ({selectedArtifact.schemaVersion})</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {selectedArtifact.qualityState}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 text-[10px] block">Source ID</span>
                  <span className="text-white font-bold">{selectedArtifact.sourceId}</span>
                </div>
                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 text-[10px] block">Acquisition Time</span>
                  <span className="text-white font-bold">{selectedArtifact.acquisitionTime}</span>
                </div>
                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 text-[10px] block">Parser & Software</span>
                  <span className="text-white font-bold">{selectedArtifact.parser} ({selectedArtifact.softwareVersion})</span>
                </div>
                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 text-[10px] block">Confidence / Uncertainty</span>
                  <span className="text-emerald-400 font-bold">C: {selectedArtifact.confidence} | U: {selectedArtifact.uncertainty}</span>
                </div>
              </div>

              <div className="space-y-1 bg-black/80 p-3 rounded-xl border border-harvest-accent/30">
                <span className="text-gray-500 text-[10px] block">Cryptographic Integrity Hash (SHA-256)</span>
                <span className="text-harvest-accent text-[11px] font-mono break-all">{selectedArtifact.integrityHash}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'epistemics' && (
        <div className="space-y-4 font-mono">
          <div className="bg-black/60 border border-harvest-border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-harvest-accent" />
              Epistemic Separation Tier Hierarchy (T0 to T4)
            </h3>
            <p className="text-[11px] text-gray-400">
              Strict semantic rules prevent conflating raw observations with model inferences, assessments, or decision support.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { tier: 'T0', name: 'OBSERVATION', desc: 'Raw captured packets, audio streams, logs, and telemetry signals.', rule: 'OBSERVED ≠ MEASURED' },
                { tier: 'T1', name: 'DERIVATION', desc: 'Parsed transactions, dialog graphs, and spectral feature vectors.', rule: 'DERIVED ≠ RAW' },
                { tier: 'T2', name: 'INFERENCE', desc: 'Probabilistic classification, speaker identification, and anomaly clustering.', rule: 'INFERRED ≠ OBSERVED' },
                { tier: 'T3', name: 'ASSESSMENT', desc: 'Threat actor profiling, risk scoring, and multi-modal correlation.', rule: 'ASSESSED ≠ FACT' },
                { tier: 'T4', name: 'DECISION_SUPPORT', desc: 'Actionable recommendations and automated containment routing.', rule: 'DECIDED ≠ AUTOMATIC' },
              ].map((t, idx) => (
                <div key={idx} className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-harvest-accent/20 text-harvest-accent font-bold flex items-center justify-center text-xs">
                      {t.tier}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{t.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-harvest-accent font-bold">
                    Rule: {t.rule}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'exceptions' && (
        <div className="space-y-4 font-mono">
          <div className="bg-black/60 border border-harvest-border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-harvest-accent" />
              Exception & Waiver Control Plane
            </h3>
            <p className="text-[11px] text-gray-400">
              Governs controlled deviations, compensating controls, independent review, and time-bound waivers.
            </p>

            <div className="space-y-3">
              {[
                { id: 'EXC-2026-001', req: 'REQ-SEC-09', class: 'SECURITY', status: 'ACTIVE_APPROVED', expiry: '2026-12-31', owner: 'Chief Information Security Officer' },
                { id: 'EXC-2026-004', req: 'REQ-DAT-02', class: 'DATA', status: 'PENDING_REVIEW', expiry: '2026-09-15', owner: 'Data Governance Board' }
              ].map((exc, i) => (
                <div key={i} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{exc.id}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-harvest-accent/20 text-harvest-accent font-bold">{exc.class}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Requirement: {exc.req} | Owner: {exc.owner}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400">Expires: {exc.expiry}</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded font-bold ${
                      exc.status === 'ACTIVE_APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {exc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'certificate' && (
        <div className="space-y-4 font-mono">
          <div className="bg-black/60 border border-harvest-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-harvest-border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-harvest-accent/20 rounded-xl text-harvest-accent border border-harvest-accent/40">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">Production Release Certificate</h3>
                  <p className="text-[11px] text-gray-400">DCOIP-X // UCM-LEX v∞ Compliance Verification</p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                PRODUCTION_ACCEPTED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-gray-500 text-[10px] block">Release ID</span>
                <span className="text-white font-bold">REL-2026-DCOIP-X-PROD</span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-gray-500 text-[10px] block">Commit Hash</span>
                <span className="text-harvest-accent font-bold">git:a9f81bc74</span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-gray-500 text-[10px] block">Accepting Authority</span>
                <span className="text-white font-bold">Automated Acceptance Gate</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-gray-400 font-bold">Acceptance Algebra Verification (100% Pass):</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Functional Pass
                </div>
                <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Data Integrity Pass
                </div>
                <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Provenance Pass
                </div>
                <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Security Pass
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
