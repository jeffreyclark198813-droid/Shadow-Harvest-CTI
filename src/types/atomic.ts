/**
 * ATOMIC DATA INVARIANTS & EPISTEMIC CONSTITUTION
 * Unified CTI Intelligence Platform: Scientific Engineering Reconstruction Specification
 */

export type EpistemicLevel = 'T0' | 'T1' | 'T2' | 'T3' | 'T4';

export type EvidenceClass = 
  | 'OBSERVED' 
  | 'DERIVED' 
  | 'INFERRED' 
  | 'ASSESSED' 
  | 'PROPOSED' 
  | 'UNKNOWN' 
  | 'CONFLICTING' 
  | 'UNVERIFIED';

export type IntegrityStatus = 
  | 'VERIFIED' 
  | 'TAMPER_DETECTED' 
  | 'PROVENANCE_INCOMPLETE' 
  | 'UNVERIFIED';

export type AccessClassification = 'TLP:CLEAR' | 'TLP:GREEN' | 'TLP:AMBER' | 'TLP:RED';

export enum ConfidenceLevel {
  STOCHASTIC = 0.2,
  PROBABILISTIC = 0.5,
  DETERMINISTIC = 0.9,
  ABSOLUTE = 1.0
}

export interface EvidenceAtom {
  id: string;
  evidenceClass: EvidenceClass;
  epistemicLevel: EpistemicLevel;
  sourceId: string;
  sourceType: string;
  observedAt: string;
  retrievedAt: string;
  collector: string;
  location?: string;
  rawReference?: string;
  contentHash: string;
  parentEvidenceIds: string[];
  transformationIds: string[];
  confidence: number;
  reliability: string; // Admiralty Code (e.g. A1, B2, C3)
  integrityStatus: IntegrityStatus;
  accessClassification: AccessClassification;
  retentionPolicy: string;
  claimText?: string;
  metadata?: Record<string, any>;
}

export interface ProvenanceChainNode {
  id: string;
  level: EpistemicLevel;
  label: string;
  evidenceClass: EvidenceClass;
  source: string;
  timestamp: string;
  transformation?: string;
  status: IntegrityStatus;
}

export interface CompetingHypothesis {
  id: string;
  code: 'H1' | 'H2' | 'H3' | 'H4';
  title: string;
  description: string;
  probability: number;
  supportingEvidenceIds: string[];
  falsificationCriteria: string;
  status: 'active' | 'falsified' | 'supported' | 'inconclusive';
}

export interface MetricLineage {
  metricName: string;
  formulaVersion: string;
  formulaDefinition: string;
  numerator: string;
  denominator: string;
  unit: string;
  inputEvidenceIds: string[];
  calculationTimestamp: string;
  result: number;
  uncertainty: number;
  temporalWindow: string;
}

export interface AtomicMetadata {
  provenance: string;
  timestamp_utc: string;
  entropy_score: number;
  verification_criteria: string[];
  epistemic_level?: EpistemicLevel;
  evidence_class?: EvidenceClass;
}

export interface EntityAtomicContext {
  uid: string;
  label: string;
  classification: 'ACTOR' | 'ASSET' | 'INFRASTRUCTURE' | 'SIGNAL';
  confidence: ConfidenceLevel;
  metadata: AtomicMetadata;
  evidence_artifacts: string[];
}

export interface ReliabilityMetric {
  latency_ms: number;
  model_id: string;
  token_efficiency: number;
  failure_rate: number;
  retry_count: number;
  timestamp?: number;
}

export interface ArchitecturalInvariants {
  version: string;
  engine: 'Antigravity' | 'Gemini-3.7';
  environment: 'PRODUCTION' | 'STAGING';
  is_non_regressive: boolean;
  epistemic_enforcement: boolean;
}
