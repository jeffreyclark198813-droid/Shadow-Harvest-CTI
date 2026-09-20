export type SocialPlatformId = 
  | 'github'
  | 'twitter_x'
  | 'linkedin'
  | 'reddit'
  | 'telegram'
  | 'keybase'
  | 'mastodon'
  | 'hackernews'
  | 'gitlab'
  | 'discord_matrix'
  | 'medium'
  | 'devto'
  | 'bluesky'
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'custom';

export interface SocialPlatformConfig {
  id: SocialPlatformId;
  name: string;
  category: 'Developer & Code' | 'Microblogging' | 'Professional' | 'Community & Forums' | 'Messaging & Identity' | 'Publishing & Media';
  baseUrl: string;
  iconName: string;
  color: string;
  bgLight: string;
  supportsGPG: boolean;
  publicApiAvailable: boolean;
  ethicalGuidelineNote: string;
}

export interface CorrelationVector {
  vectorType: 
    | 'Exact Handle Match' 
    | 'Email Prefix Match' 
    | 'Bio Phrasing & Linguistic Overlap' 
    | 'PGP Key Fingerprint Match' 
    | 'Avatar Perceptual Hash Match' 
    | 'Timezone & Temporal Cadence Alignment' 
    | 'Code Repository / Tech Stack Match' 
    | 'Cross-Referenced External Link' 
    | 'Crypto Wallet Association';
  confidence: number; // 0.0 - 1.0
  evidence: string;
  weight: number;
}

export interface PlatformActivityPattern {
  timeOfDayCadence: 'Morning (06:00-12:00 UTC)' | 'Afternoon (12:00-18:00 UTC)' | 'Evening/Night (18:00-02:00 UTC)' | 'Late Night/Graveyard (02:00-06:00 UTC)' | 'Distributed / 24-7 Automated';
  activeDaysOfWeek: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  peakPostingHoursUTC: number[]; // e.g. [14, 15, 16, 20]
  inferredTimezone: string; // e.g. "UTC+02:00 (EET/CEST)"
  postingFrequency: 'Very Active (>10/day)' | 'Moderate (1-5/day)' | 'Sporadic (<1/week)' | 'Dormant (>6mo)';
  hourlyDistribution: number[]; // 24 numbers representing activity intensity (0-100) per hour UTC
  dayDistribution: { day: string; count: number }[]; // 7 days of week
  estimatedActivityCadenceSummary: string;
}

export interface PlatformMetadataSignatures {
  programmingLanguages?: string[];
  topicsOfInterest?: string[];
  cryptocurrencyAddresses?: string[];
  pgpKeyIds?: string[];
  linkedWebsites?: string[];
  apparentLanguageDialect?: string;
  locationClaimed?: string;
  opsecScore?: number; // 0-100 (100 = strict opsec, 0 = high leakage)
  opsecFindings?: string[];
}

export interface EthicalOSINTAudit {
  publicDataOnly: boolean;
  scrapingMethod: 'Public REST API / GraphQL' | 'Passive Search Engine Index' | 'Permissive Headless Walk' | 'Open Graph Protocol Meta';
  robotsTxtCompliant: boolean;
  rateLimited: boolean;
  noAuthenticationBypass: boolean;
  privacyImpactAssessment: 'Low Risk' | 'Controlled OSINT' | 'Sensitive Subject';
  tlpLevel: 'TLP:CLEAR' | 'TLP:GREEN' | 'TLP:AMBER';
  auditTimestamp: string;
  dataProvenanceNote: string;
}

export interface SocialProfileEntity {
  id: string;
  platformId: SocialPlatformId;
  platformName: string;
  handle: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  avatarHash?: string;
  bio?: string;
  location?: string;
  followersCount?: number;
  followingCount?: number;
  publicRepoCount?: number;
  publicPostCount?: number;
  accountCreationDate?: string;
  accountAgeYears?: number;
  verifiedStatus: boolean;
  confidenceScore: number; // 0.0 - 1.0 match confidence
  correlationVectors: CorrelationVector[];
  activityPattern: PlatformActivityPattern;
  metadataSignatures: PlatformMetadataSignatures;
  ethicalCompliance: EthicalOSINTAudit;
  recentPublicActivities: {
    type: 'post' | 'commit' | 'reply' | 'star' | 'follow' | 'gist';
    title: string;
    timestamp: string;
    url?: string;
    extractedKeywords?: string[];
  }[];
  insightsGained: string[];
  isLinkedToGraph: boolean;
  status: 'confirmed_match' | 'probable_match' | 'under_review' | 'rejected_false_positive';
}

export interface DiscoveredConnectionInsight {
  id: string;
  category: 'Identity Attribution' | 'Geotemporal Pattern' | 'Technical Capability' | 'Operational Security' | 'Network Affiliation';
  title: string;
  insightText: string;
  supportingProfileIds: string[];
  confidence: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  actionableLead?: string;
  stixPattern?: string;
  timestamp: string;
}

export interface PersonaSocialCorrelationResult {
  id?: string;
  personaId: string;
  personaLabel: string;
  targetId: string;
  queriedUsernames: string[];
  queriedEmails: string[];
  queriedWallets?: string[];
  queriedPGP?: string[];
  discoveredProfiles: SocialProfileEntity[];
  insights: DiscoveredConnectionInsight[];
  aggregateTimezoneConsensus: {
    primaryTimezone: string;
    confidence: number;
    supportingPlatformsCount: number;
    summary: string;
  };
  overallCorrelationConfidence: number;
  ethicalAuditSummary: {
    totalProfilesAudited: number;
    allPublicDataVerified: boolean;
    nonIntrusiveGatingEnforced: boolean;
    tlpDesignation: 'TLP:CLEAR' | 'TLP:GREEN' | 'TLP:AMBER';
    analystAttestation: string;
  };
  timestamp: any;
}
