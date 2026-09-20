export type GraphDimension = 'infrastructure' | 'identity' | 'financial' | 'artifact';

export interface UnifiedGraphNode {
  id: string;
  label: string;
  dimension: GraphDimension;
  type: string; // e.g. 'ip' | 'domain' | 'asn' | 'persona' | 'email' | 'wallet' | 'transaction' | 'malware_hash' | 'ttp' etc.
  metadata?: {
    confidence?: number;
    source?: string;
    firstSeen?: string;
    lastSeen?: string;
    description?: string;
    properties?: Record<string, any>;
    country?: string;
    lat?: number;
    lng?: number;
    [key: string]: any;
  };
}

export interface UnifiedGraphEdge {
  id?: string;
  source: string;
  target: string;
  relationship: string; // e.g. 'OPERATES', 'RESOLVES_TO', 'OWNS_WALLET', 'INITIATED', 'AUTHORED', 'HOSTS', 'FUNDS', 'CONNECTS_TO', 'EXHIBITS_CADENCE'
  confidence?: number;
  dataSource?: string;
  weight?: number;
  metadata?: Record<string, any>;
}

export interface UnifiedGraphStats {
  totalNodes: number;
  totalEdges: number;
  infrastructureCount: number;
  identityCount: number;
  financialCount: number;
  artifactCount: number;
  density: number;
}

export interface Neo4jConnectionConfig {
  uri: string;
  username: string;
  password?: string;
  database?: string;
  encrypted?: boolean;
}

export interface MaltegoExportConfig {
  includeWeights?: boolean;
  includeLinkNotes?: boolean;
  format?: 'csv' | 'graphml';
}
