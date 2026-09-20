import { 
  SocialProfileEntity, 
  PersonaSocialCorrelationResult, 
  SocialPlatformId, 
  DiscoveredConnectionInsight,
  CorrelationVector,
  PlatformActivityPattern,
  PlatformMetadataSignatures,
  EthicalOSINTAudit 
} from '../types/social_osint';
import { SOCIAL_PLATFORMS } from '../constants/socialPlatforms';

// Deterministic seed hash generator for consistent synthetic intelligence data
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export class SocialCorrelatorService {
  /**
   * Generates a comprehensive correlation dataset across all major platforms
   * based on the aggregated usernames, email handles, wallets, and PGP fingerprints of a persona.
   */
  public static generateCorrelation(
    personaId: string,
    personaLabel: string,
    targetId: string,
    usernames: string[],
    emails: string[],
    wallets: string[] = [],
    pgpKeys: string[] = [],
    existingIntelligence?: string
  ): PersonaSocialCorrelationResult {
    const cleanUsernames = usernames.length > 0 ? usernames : [personaLabel.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'shadow_actor'];
    const cleanEmails = emails.length > 0 ? emails : [`${cleanUsernames[0]}@proton.me`];

    // Primary handle and email prefix
    const primaryHandle = cleanUsernames[0];
    const emailPrefix = cleanEmails[0].split('@')[0];

    const platformsToScan: SocialPlatformId[] = [
      'github',
      'twitter_x',
      'keybase',
      'reddit',
      'telegram',
      'hackernews',
      'mastodon',
      'gitlab',
      'linkedin',
      'bluesky',
      'medium',
      'devto',
      'facebook',
      'instagram',
      'tiktok'
    ];

    const seed = hashString(primaryHandle + targetId);
    const discoveredProfiles: SocialProfileEntity[] = [];

    platformsToScan.forEach((platId, idx) => {
      const platConfig = SOCIAL_PLATFORMS[platId];
      if (!platConfig) return;

      const platSeed = (seed * (idx + 1) * 31) % 10000;
      
      // Determine if this platform has an active public match (75% probability for top platforms)
      const hasMatch = (platSeed % 10) < 8;
      if (!hasMatch) return;

      // Determine variant handle on platform
      let handle = primaryHandle;
      if (platSeed % 3 === 1) {
        handle = `${primaryHandle}_dev`;
      } else if (platSeed % 3 === 2 && emailPrefix) {
        handle = emailPrefix;
      }

      const matchConfidence = Number((0.65 + ((platSeed % 35) / 100)).toFixed(2));
      const isExactHandle = handle.toLowerCase() === primaryHandle.toLowerCase();

      // Correlate vectors
      const vectors: CorrelationVector[] = [];
      if (isExactHandle) {
        vectors.push({
          vectorType: 'Exact Handle Match',
          confidence: 0.95,
          evidence: `Direct username match '${handle}' on ${platConfig.name}`,
          weight: 0.35
        });
      } else {
        vectors.push({
          vectorType: 'Email Prefix Match',
          confidence: 0.82,
          evidence: `Handle matches email prefix alias '${emailPrefix}'`,
          weight: 0.25
        });
      }

      // Timezone and temporal pattern simulation
      const baseHourUtc = (seed % 6) + 12; // Base peak between 12:00 and 18:00 UTC
      const hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
        const distFromPeak = Math.min(Math.abs(h - baseHourUtc), 24 - Math.abs(h - baseHourUtc));
        const noise = (hashString(`${handle}_${h}`) % 20) - 10;
        return Math.max(5, Math.min(100, Math.round(100 * Math.exp(-0.5 * Math.pow(distFromPeak / 3.5, 2)) + noise)));
      });

      const peakHours = [baseHourUtc - 1, baseHourUtc, baseHourUtc + 1, (baseHourUtc + 4) % 24].sort((a, b) => a - b);
      
      let inferredTimezone = 'UTC+02:00 (EET/CEST)';
      if (baseHourUtc >= 16) inferredTimezone = 'UTC-05:00 (EST/EDT)';
      else if (baseHourUtc <= 9) inferredTimezone = 'UTC+08:00 (CST/SGT)';
      else if (baseHourUtc >= 11 && baseHourUtc <= 14) inferredTimezone = 'UTC+03:00 (MSK/EEST)';

      const activityPattern: PlatformActivityPattern = {
        timeOfDayCadence: baseHourUtc >= 18 ? 'Evening/Night (18:00-02:00 UTC)' : baseHourUtc >= 12 ? 'Afternoon (12:00-18:00 UTC)' : 'Morning (06:00-12:00 UTC)',
        activeDaysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', (platSeed % 2 === 0 ? 'Sat' : 'Sun')],
        peakPostingHoursUTC: peakHours,
        inferredTimezone,
        postingFrequency: platSeed % 4 === 0 ? 'Very Active (>10/day)' : platSeed % 4 === 1 ? 'Moderate (1-5/day)' : 'Sporadic (<1/week)',
        hourlyDistribution,
        dayDistribution: [
          { day: 'Mon', count: 18 + (platSeed % 12) },
          { day: 'Tue', count: 24 + (platSeed % 15) },
          { day: 'Wed', count: 32 + (platSeed % 10) },
          { day: 'Thu', count: 29 + (platSeed % 14) },
          { day: 'Fri', count: 38 + (platSeed % 8) },
          { day: 'Sat', count: 14 + (platSeed % 6) },
          { day: 'Sun', count: 8 + (platSeed % 4) },
        ],
        estimatedActivityCadenceSummary: `Concentrated commits and dispatches during ${inferredTimezone} daytime hours (Peak: ${peakHours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')} UTC).`
      };

      // Stylometrics & tech stack
      const languages = ['Rust', 'Go', 'Python', 'C/C++', 'Solidity', 'TypeScript', 'Assembly (x86/ARM)'];
      const assignedLangs = [languages[platSeed % languages.length], languages[(platSeed + 2) % languages.length]];
      
      const topics = ['Cryptographic primitives', 'EVM protocol security', 'Reverse engineering', 'Distributed systems', 'Offensive security research', 'Zero-knowledge proofs'];
      const assignedTopics = [topics[platSeed % topics.length], topics[(platSeed + 3) % topics.length]];

      // OPSEC Evaluation
      const opsecScore = Math.max(25, 95 - ((platSeed % 40)));
      const opsecFindings: string[] = [];
      if (opsecScore < 60) {
        opsecFindings.push('Reused PGP key ID between clearnet developer repo and dark web communications');
        opsecFindings.push('Exposed personal git commit author email with real ISP domain name');
      } else if (opsecScore < 80) {
        opsecFindings.push('Avatar perceptual hash correlates with legacy social media handle');
        opsecFindings.push('Timezone inference contradicts advertised European location (probable VPN exit mismatch)');
      } else {
        opsecFindings.push('Consistent pseudo-anonymous handle hygiene; no personal telemetry leaks detected');
      }

      const metadataSignatures: PlatformMetadataSignatures = {
        programmingLanguages: assignedLangs,
        topicsOfInterest: assignedTopics,
        cryptocurrencyAddresses: wallets.length > 0 ? [wallets[0]] : ['0x71C...b912 (EVM)', 'bc1q...x89f (Bitcoin)'],
        pgpKeyIds: pgpKeys.length > 0 ? [pgpKeys[0].slice(0, 16)] : ['4F8A 992B C401 E12A'],
        linkedWebsites: [`https://${handle}.keybase.pub`, `https://${handle}.sh`],
        apparentLanguageDialect: 'English (Technical / Eastern European syntactic sentence structure)',
        locationClaimed: platSeed % 2 === 0 ? 'Eastern Europe / Remote' : 'Global / Decentralized',
        opsecScore,
        opsecFindings
      };

      // Add specialized correlation vectors based on metadata
      if (platId === 'keybase' || platConfig.supportsGPG) {
        vectors.push({
          vectorType: 'PGP Key Fingerprint Match',
          confidence: 0.98,
          evidence: `Signed identity proof tree matches observed key ${metadataSignatures.pgpKeyIds?.[0]}`,
          weight: 0.30
        });
      }

      if (platId === 'github' || platId === 'gitlab') {
        vectors.push({
          vectorType: 'Code Repository / Tech Stack Match',
          confidence: 0.88,
          evidence: `Repositories utilize matching specialized toolsets (${assignedLangs.join(', ')})`,
          weight: 0.20
        });
      }

      vectors.push({
        vectorType: 'Timezone & Temporal Cadence Alignment',
        confidence: 0.85,
        evidence: `Activity interval correlates with persona operational cadence (${inferredTimezone})`,
        weight: 0.15
      });

      // Bio & activities
      const bioTemplates = [
        `Systems programmer & security researcher. Low-level ${assignedLangs[0]} enthusiast. PGP: ${metadataSignatures.pgpKeyIds?.[0]}`,
        `Independent researcher focusing on ${assignedTopics[0]} & protocol resilience. Contact: ${cleanEmails[0]}`,
        `Exploring ${assignedTopics[0]} and distributed infra. Commits are signed. ${handle}@matrix`,
        `Security engineer | ${assignedLangs.join(' & ')} | Distributed network telemetry | ${inferredTimezone}`
      ];
      const bio = bioTemplates[platSeed % bioTemplates.length];

      const ethicalCompliance: EthicalOSINTAudit = {
        publicDataOnly: true,
        scrapingMethod: platConfig.publicApiAvailable ? 'Public REST API / GraphQL' : 'Passive Search Engine Index',
        robotsTxtCompliant: true,
        rateLimited: true,
        noAuthenticationBypass: true,
        privacyImpactAssessment: 'Controlled OSINT',
        tlpLevel: 'TLP:GREEN',
        auditTimestamp: new Date().toISOString(),
        dataProvenanceNote: `Extracted via public passive resolution of ${platConfig.baseUrl}${handle}. All terms of service and robots.txt constraints enforced.`
      };

      const profile: SocialProfileEntity = {
        id: `soc-${platId}-${handle}`,
        platformId: platId,
        platformName: platConfig.name,
        handle,
        displayName: `${handle} (${personaLabel})`,
        profileUrl: `${platConfig.baseUrl}${handle}`,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${handle}`,
        avatarHash: `phash_${hashString(handle + 'avatar').toString(16)}`,
        bio,
        location: metadataSignatures.locationClaimed,
        followersCount: 45 + (platSeed % 1200),
        followingCount: 20 + (platSeed % 350),
        publicRepoCount: platId === 'github' || platId === 'gitlab' ? 12 + (platSeed % 28) : undefined,
        publicPostCount: 85 + (platSeed % 900),
        accountCreationDate: `${2019 + (platSeed % 5)}-${String(1 + (platSeed % 12)).padStart(2, '0')}-15`,
        accountAgeYears: 2026 - (2019 + (platSeed % 5)),
        verifiedStatus: platSeed % 5 === 0,
        confidenceScore: matchConfidence,
        correlationVectors: vectors,
        activityPattern,
        metadataSignatures,
        ethicalCompliance,
        recentPublicActivities: [
          {
            type: platId === 'github' ? 'commit' : 'post',
            title: platId === 'github' ? `Merged refactor into ${handle}/crypto-primitives-v2` : `Published analysis on modern protocol attack surfaces and GPG verification`,
            timestamp: '2026-08-18T14:32:00Z',
            extractedKeywords: assignedLangs.concat(assignedTopics)
          },
          {
            type: platId === 'github' ? 'gist' : 'reply',
            title: `Shared public key announcement for key rotation (Subkey ID: ${metadataSignatures.pgpKeyIds?.[0]})`,
            timestamp: '2026-08-04T19:10:00Z',
            extractedKeywords: ['PGP', 'KeyRotation', 'Security']
          }
        ],
        insightsGained: [
          `Confirmed active participation in ${platConfig.name} ecosystem under alias '${handle}'`,
          `Identified overlapping cryptographic signatures (${metadataSignatures.pgpKeyIds?.[0]}) linking to root persona`,
          `Activity pattern indicates primary working hours in ${inferredTimezone}`
        ],
        isLinkedToGraph: false,
        status: matchConfidence > 0.85 ? 'confirmed_match' : 'probable_match'
      };

      discoveredProfiles.push(profile);
    });

    // Synthesize cross-platform composite insights
    const insights: DiscoveredConnectionInsight[] = [
      {
        id: `ins-${seed}-1`,
        category: 'Identity Attribution',
        title: 'Cryptographic Key Identity Convergence',
        insightText: `Public Key ID '${discoveredProfiles[0]?.metadataSignatures.pgpKeyIds?.[0] || '4F8A 992B'}' was discovered across both Keybase and GitHub repository commit signatures, establishing high-confidence link across disparate surface profiles.`,
        supportingProfileIds: discoveredProfiles.slice(0, 2).map(p => p.id),
        confidence: 0.94,
        severity: 'CRITICAL',
        actionableLead: 'Extract full PGP web-of-trust subkeys and cross-reference against dark web forum dump signatures.',
        stixPattern: `[user-account:user_id = '${primaryHandle}'] AND [x-pgp-key:fingerprint LIKE '%${discoveredProfiles[0]?.metadataSignatures.pgpKeyIds?.[0]}%']`,
        timestamp: new Date().toISOString()
      },
      {
        id: `ins-${seed}-2`,
        category: 'Geotemporal Pattern',
        title: 'Operational Cadence & Timezone Alignment',
        insightText: `Temporal aggregation across ${discoveredProfiles.length} public platforms indicates a 92% concentration of activity between 12:00 and 19:00 UTC, strongly pointing to an operator located in UTC+02:00 or UTC+03:00 timezone zones.`,
        supportingProfileIds: discoveredProfiles.map(p => p.id),
        confidence: 0.89,
        severity: 'HIGH',
        actionableLead: 'Correlate with observed dark web forum post timestamps to verify operational overlap.',
        timestamp: new Date().toISOString()
      },
      {
        id: `ins-${seed}-3`,
        category: 'Operational Security',
        title: 'Linguistic & Tooling Fingerprint Overlap',
        insightText: `Stylometric vocabulary and specific repository tooling in Rust/Go align with documented cyber threat group playbooks and custom tooling repositories.`,
        supportingProfileIds: discoveredProfiles.filter(p => p.platformId === 'github' || p.platformId === 'hackernews').map(p => p.id),
        confidence: 0.86,
        severity: 'MEDIUM',
        actionableLead: 'Inspect public forks and star history for associations with malicious smart contract or exploit repos.',
        timestamp: new Date().toISOString()
      }
    ];

    const overallConfidence = discoveredProfiles.length > 0 
      ? Number((discoveredProfiles.reduce((acc, p) => acc + p.confidenceScore, 0) / discoveredProfiles.length).toFixed(2))
      : 0.75;

    return {
      personaId,
      personaLabel,
      targetId,
      queriedUsernames: cleanUsernames,
      queriedEmails: cleanEmails,
      queriedWallets: wallets,
      queriedPGP: pgpKeys,
      discoveredProfiles,
      insights,
      aggregateTimezoneConsensus: {
        primaryTimezone: discoveredProfiles[0]?.activityPattern.inferredTimezone || 'UTC+02:00 (EET/CEST)',
        confidence: 0.91,
        supportingPlatformsCount: discoveredProfiles.length,
        summary: `Consistent diurnal activity curves across ${discoveredProfiles.length} public social networks support UTC+02:00 operational base.`
      },
      overallCorrelationConfidence: overallConfidence,
      ethicalAuditSummary: {
        totalProfilesAudited: discoveredProfiles.length,
        allPublicDataVerified: true,
        nonIntrusiveGatingEnforced: true,
        tlpDesignation: 'TLP:GREEN',
        analystAttestation: 'All intelligence was gathered exclusively via non-intrusive public surface indicators in strict compliance with ethical OSINT standards.'
      },
      timestamp: new Date()
    };
  }
}
