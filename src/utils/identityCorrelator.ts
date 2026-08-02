export type Platform =
  | 'Signal'
  | 'Telegram'
  | 'Matrix'
  | 'XMPP'
  | 'Email'
  | 'Other';

export interface IdentifierMetadata {
  bio?: string;
  creationDate?: string;
  username?: string;
  [key: string]: unknown;
}

export interface Identifier {
  platform: Platform;
  value: string;
  metadata?: IdentifierMetadata;
}

export interface MatchEvidence {
  signal: string;
  contribution: number;
}

export interface CorrelationMatch {
  identifier1: Identifier;
  identifier2: Identifier;
  confidence: number;
  evidence: MatchEvidence[];
}

interface NormalizedIdentifier {
  original: Identifier;
  username: string;
  metadata: IdentifierMetadata;
}

const SCORE_WEIGHTS = {
  exactUsername: 0.55,
  partialUsername: 0.25,
  prefixSimilarity: 0.15,
  matchingBio: 0.25,
  creationProximity: 0.10,
} as const;

const normalizeIdentifier = (
  identifier: Identifier
): NormalizedIdentifier => {
  let username = identifier.value
    .trim()
    .toLowerCase();

  switch (identifier.platform) {
    case 'Email':
      username = username.split('@')[0];
      break;

    case 'Matrix':
    case 'XMPP':
      username = username
        .split(':')[0]
        .replace(/^@/, '');
      break;

    default:
      username = username.replace(/^@/, '');
  }

  return {
    original: identifier,
    username,
    metadata: identifier.metadata ?? {},
  };
};

const calculateDateDistance = (
  first?: string,
  second?: string
): number | null => {
  if (!first || !second) return null;

  const a = Date.parse(first);
  const b = Date.parse(second);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    return null;
  }

  return Math.abs(a - b) / 86_400_000;
};

const compareUsernames = (
  a: string,
  b: string,
  evidence: MatchEvidence[]
): number => {
  let score = 0;

  if (a.length > 4 && a === b) {
    score += SCORE_WEIGHTS.exactUsername;

    evidence.push({
      signal: 'Exact normalized username match',
      contribution: SCORE_WEIGHTS.exactUsername,
    });

    return score;
  }

  if (
    a.length > 4 &&
    b.length > 4 &&
    (a.includes(b) || b.includes(a))
  ) {
    score += SCORE_WEIGHTS.partialUsername;

    evidence.push({
      signal: 'Partial username overlap',
      contribution: SCORE_WEIGHTS.partialUsername,
    });
  }

  if (
    a.length >= 5 &&
    b.length >= 5 &&
    a.substring(0, 5) === b.substring(0, 5)
  ) {
    score += SCORE_WEIGHTS.prefixSimilarity;

    evidence.push({
      signal: 'Username prefix similarity',
      contribution: SCORE_WEIGHTS.prefixSimilarity,
    });
  }

  return score;
};

const compareMetadata = (
  a: IdentifierMetadata,
  b: IdentifierMetadata,
  evidence: MatchEvidence[]
): number => {
  let score = 0;

  if (
    a.bio &&
    b.bio &&
    a.bio.trim().toLowerCase() === b.bio.trim().toLowerCase()
  ) {
    score += SCORE_WEIGHTS.matchingBio;

    evidence.push({
      signal: 'Matching profile metadata',
      contribution: SCORE_WEIGHTS.matchingBio,
    });
  }

  const days = calculateDateDistance(
    a.creationDate,
    b.creationDate
  );

  if (days !== null && days <= 1) {
    score += SCORE_WEIGHTS.creationProximity;

    evidence.push({
      signal: 'Creation date proximity',
      contribution: SCORE_WEIGHTS.creationProximity,
    });
  }

  return score;
};

const compareIdentifiers = (
  first: NormalizedIdentifier,
  second: NormalizedIdentifier
): CorrelationMatch | null => {
  const evidence: MatchEvidence[] = [];

  const confidence =
    compareUsernames(
      first.username,
      second.username,
      evidence
    ) +
    compareMetadata(
      first.metadata,
      second.metadata,
      evidence
    );

  const normalizedConfidence = Math.min(
    Number(confidence.toFixed(3)),
    1
  );

  if (normalizedConfidence < 0.3) {
    return null;
  }

  return {
    identifier1: first.original,
    identifier2: second.original,
    confidence: normalizedConfidence,
    evidence,
  };
};

export const analyzeIdentifiers = (
  identifiers: Identifier[]
): CorrelationMatch[] => {
  const normalized = identifiers.map(
    normalizeIdentifier
  );

  const matches: CorrelationMatch[] = [];

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const match = compareIdentifiers(
        normalized[i],
        normalized[j]
      );

      if (match) {
        matches.push(match);
      }
    }
  }

  return matches.sort(
    (a, b) =>
      b.confidence - a.confidence
  );
};