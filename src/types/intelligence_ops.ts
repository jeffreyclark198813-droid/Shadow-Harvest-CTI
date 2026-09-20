import { Timestamp } from '../firebase';

export type ProvenanceState = 'ingestion' | 'normalization' | 'validation' | 'inference';

export interface ArtifactProvenance {
  id?: string;
  artifactId: string;
  state: ProvenanceState;
  progress: number; // 0-100
  updatedAt: Timestamp;
  history: {
    state: ProvenanceState;
    timestamp: Timestamp;
    details: string;
  }[];
}

export interface TemporalDrift {
  id?: string;
  artifactAId: string;
  artifactAName: string;
  artifactBId: string;
  artifactBName: string;
  driftMs: number;
  status: 'flagged' | 'reconciled';
  adjustedMs: number;
  reconciledBy?: string;
  reconciledAt?: Timestamp;
}

export interface ConfidenceTrendPoint {
  score: number;
  timestamp: number; // unix epoch
  artifactId?: string;
}

export interface Hypothesis {
  id?: string;
  title: string;
  description: string;
  currentConfidence: number;
  trend: ConfidenceTrendPoint[];
  createdBy: string;
  createdAt: Timestamp;
}

export interface EntropyPoint {
  id: string;
  x: number; // 0-100
  y: number; // 0-100
  value: number; // 0-1
  label: string;
  artifactId?: string;
}

export type APIHealthStatus = 'healthy' | 'degraded' | 'offline' | 'maintenance';

export interface APISource {
  id: string;
  name: string;
  endpoint: string;
  status: APIHealthStatus;
  lastChecked: Timestamp;
  rateLimit: {
    consumed: number;
    total: number;
    resetAt: Timestamp;
  };
  license: {
    type: string;
    expiresAt: Timestamp;
    provider: string;
  };
}

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: Timestamp;
}

export type IdentityVectorType = 
  | 'Forum Alias ➔ Social Media' 
  | 'Email Pattern Match' 
  | 'Crypto Wallet Overlap' 
  | 'PGP Key Fingerprint' 
  | 'Dark Web Alias' 
  | 'Stylometric Signature' 
  | 'Infrastructure Re-use';

export interface DigitalIdentityCorrelation {
  id: string;
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  sharedFootprint: string;
  confidence: number;
  vector: IdentityVectorType;
  mitreAlignment: string;
  evidenceDetails: string[];
  status: 'suggested' | 'confirmed' | 'rejected';
  timestamp: number;
}

export interface CommunicationPatternEvent {
  id: string;
  sourceId: string;
  targetId: string;
  channel: 'Telegram' | 'Matrix/Element' | 'Signal' | 'Tor Hidden Service' | 'PGP Encrypted Forum' | 'XMPP/Jabber';
  timestamp: number;
  hourUTC: number;
  frequencyBurst: 'low' | 'medium' | 'high' | 'critical';
  volumeBytes: number;
  encryptionMode: string;
  protocolMetadata: {
    hopCount: number;
    relayNode?: string;
    userAgent?: string;
  };
}

export interface SNAMetricData {
  personaId: string;
  label: string;
  role: 'Coordinator / Leader' | 'Broker / Courier' | 'Technical Specialist' | 'Financial Mule' | 'Peripheral Asset';
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  eigenvectorCentrality: number;
  clusteringCoefficient: number;
  anonymityRiskScore: number;
  totalDirectConnections: number;
  dominantTimezone: string;
  primaryCommunicationChannel: string;
}

export interface CommunityCluster {
  id: string;
  name: string;
  theme: string;
  color: string;
  density: number;
  memberIds: string[];
  bridgePersonaIds: string[];
}

export type RedactionMode = 'REPLACE_TOKEN' | 'FULL_MASK' | 'HASH_SHA256' | 'PARTIAL_MASK';

export type SensitiveDataCategory = 
  | 'PII' 
  | 'FINANCIAL' 
  | 'CREDENTIAL' 
  | 'INFRASTRUCTURE' 
  | 'CLASSIFIED_HANDLE' 
  | 'CUSTOM';

export interface AnonymizationRule {
  id: string;
  name: string;
  description: string;
  category: SensitiveDataCategory;
  pattern: string;
  isRegex: boolean;
  redactionMode: RedactionMode;
  customMaskFormat?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  enabled: boolean;
  examples: string[];
}

export interface RedactionFinding {
  id: string;
  ruleId: string;
  ruleName: string;
  category: SensitiveDataCategory;
  matchedText: string;
  redactedText: string;
  startIndex: number;
  endIndex: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AnonymizationProfile {
  id: string;
  name: string;
  description: string;
  ruleIds: string[];
  defaultMode: RedactionMode;
  isPreset: boolean;
}

export interface AnonymizedReportResult {
  originalText: string;
  redactedText: string;
  findings: RedactionFinding[];
  redactionCount: number;
  riskReductionScore: number;
  categoryBreakdown: Record<SensitiveDataCategory, number>;
  anonymizedAt: number;
}

export interface AnonymizedGraphResult {
  originalNodesCount: number;
  originalEdgesCount: number;
  anonymizedNodes: any[];
  anonymizedEdges: any[];
  redactedEntitiesCount: number;
  tokenMapping: Record<string, string>;
  anonymizedAt: number;
}


