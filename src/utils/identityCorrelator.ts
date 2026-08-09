export interface Identifier {
  platform: 'Signal' | 'Telegram' | 'Matrix' | 'XMPP' | 'Email' | 'Other';
  value: string;
  metadata?: Record<string, any>;
}

export interface CorrelationMatch {
  identifier1: Identifier;
  identifier2: Identifier;
  probability: number;
  reason: string;
}

export const analyzeIdentifiers = (identifiers: Identifier[]): CorrelationMatch[] => {
  const matches: CorrelationMatch[] = [];

  for (let i = 0; i < identifiers.length; i++) {
    for (let j = i + 1; j < identifiers.length; j++) {
      const id1 = identifiers[i];
      const id2 = identifiers[j];

      let probability = 0;
      let reasons: string[] = [];

      // Pattern matching (e.g., username reuse)
      const extractUsername = (id: Identifier) => {
        if (id.platform === 'Matrix' || id.platform === 'XMPP') {
          return id.value.split(':')[0].replace('@', '');
        }
        if (id.platform === 'Email') {
           return id.value.split('@')[0];
        }
        return id.value.replace('@', ''); // Assuming Telegram uses @username
      };

      const user1 = extractUsername(id1).toLowerCase();
      const user2 = extractUsername(id2).toLowerCase();

      if (user1 === user2 && user1.length > 4) { // Ignore short common names
        probability += 0.6;
        reasons.push('Exact username match');
      } else if (user1.includes(user2) || user2.includes(user1)) {
        probability += 0.3;
        reasons.push('Partial username overlap');
      }

      // Levenshtein distance could be used here for typos/variations, simplified for now
      if (user1.length > 5 && user2.length > 5 && (user1.substring(0,5) === user2.substring(0,5))) {
         probability += 0.2;
         reasons.push('Similar username prefix');
      }

      // Metadata correlation
      if (id1.metadata && id2.metadata) {
        if (id1.metadata.bio && id2.metadata.bio && id1.metadata.bio === id2.metadata.bio) {
          probability += 0.8;
          reasons.push('Identical biography/status');
        }
        if (id1.metadata.creationDate && id2.metadata.creationDate) {
           const diffTime = Math.abs(new Date(id1.metadata.creationDate).getTime() - new Date(id2.metadata.creationDate).getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
           if (diffDays <= 1) {
              probability += 0.4;
              reasons.push('Account creation temporal proximity');
           }
        }
      }

      probability = Math.min(1.0, probability); // Cap at 1.0

      if (probability > 0.3) {
        matches.push({
          identifier1: id1,
          identifier2: id2,
          probability,
          reason: reasons.join(', ')
        });
      }
    }
  }

  return matches.sort((a, b) => b.probability - a.probability);
};
