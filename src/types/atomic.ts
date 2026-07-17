/**
 * ATOMIC DATA INVARIANTS
 * Future-resilient, extensible engineering paradigm for intelligence data.
 */

export enum ConfidenceLevel {
  STOCHASTIC = 0.2,
  PROBABILISTIC = 0.5,
  DETERMINISTIC = 0.9,
  ABSOLUTE = 1.0
}

export interface AtomicMetadata {
  provenance: string;
  timestamp_utc: string;
  entropy_score: number;
  verification_criteria: string[];
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
}

export interface ArchitecturalInvariants {
  version: string;
  engine: 'Antigravity' | 'Gemini-3.5';
  environment: 'PRODUCTION' | 'STAGING';
  is_non_regressive: boolean;
}
