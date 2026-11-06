export type EndpointProtocol = 'REST' | 'GRAPHQL' | 'STREAM' | 'WEBHOOK';

export type EndpointStatus = 
  | 'DISCOVERED' 
  | 'CONFIGURED' 
  | 'VERIFIED' 
  | 'AUTHENTICATED' 
  | 'AUTHORIZED' 
  | 'ACTIVE' 
  | 'DEGRADED' 
  | 'DISABLED' 
  | 'REVOKED';

export type EvidenceState = 
  | 'OBSERVED' 
  | 'VERIFIED' 
  | 'DERIVED' 
  | 'INFERRED' 
  | 'ASSESSMENT' 
  | 'DECISION_SUPPORT' 
  | 'UNKNOWN';

export type AuthorizationStatus = 
  | 'AUTHORIZED' 
  | 'DENIED' 
  | 'NOT_AUTHORIZED' 
  | 'PENDING_VERIFICATION' 
  | 'EXPIRED' 
  | 'REVOKED' 
  | 'UNKNOWN';

export interface ApiEndpointConfig {
  id?: string;
  endpoint_id: string;
  provider: string;
  uri: string;
  protocol: EndpointProtocol;
  authentication: {
    method: 'OAuth2' | 'OIDC' | 'service_account' | 'mTLS' | 'signed_token' | 'api_key' | 'none';
    config?: any;
  };
  schema?: any;
  capabilities: string[];
  policy?: string;
  rate_limits?: {
    requests_per_minute: number;
    burst?: number;
  };
  timeout?: number;
  retry_policy?: {
    max_retries: number;
    backoff_ms: number;
  };
  provenance_requirements?: string[];
  authorization_requirements?: string[];
  metadata?: any;
  enabled: boolean;
  status: EndpointStatus;
  createdBy: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AuthorityPolicy {
  id?: string;
  principal: string;
  authenticated_identity?: string;
  requested_resource: string;
  requested_action: string;
  policy: any;
  jurisdiction_context?: string;
  authorization_source?: string;
  authorization_status: AuthorizationStatus;
  effective_from: any;
  expires_at: any;
  audit_id?: string;
}

export interface RegistryIdentifier {
  id?: string;
  identifier: string;
  classification: string;
  state: 
    | 'IDENTIFIER_CONFIGURED' 
    | 'IDENTITY_UNVERIFIED' 
    | 'AUTHENTICATED' 
    | 'AUTHORIZED' 
    | 'ENDPOINT_UNCONFIGURED' 
    | 'ENDPOINT_UNAVAILABLE' 
    | 'ACCESS_DENIED' 
    | 'NOT_AUTHORIZED' 
    | 'REDACTED' 
    | 'UNKNOWN';
  metadata?: any;
}

export interface FederatedSearchResult {
  id?: string;
  source: string;
  provider_id: string;
  query_id: string;
  retrieval_timestamp: any;
  result_id: string;
  content: any;
  source_uri?: string;
  evidence_state: EvidenceState;
  verification_state: string;
  authorization_state: string;
  provenance: any;
  integrity_metadata?: any;
  transformations: string[];
  confidence: number;
  restrictions: string[];
  raw_metadata?: any;
}
