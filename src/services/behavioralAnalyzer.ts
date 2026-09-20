import { AdvancedPersonaProfile } from './dbService';

export interface ActivityLogEntry {
  timestamp: Date | string;
  content: string;
  platform?: string;
  metadata?: Record<string, any>;
}

export class BehavioralAnalyzer {
  /**
   * Processes a collection of raw activity logs to generate high-fidelity metrics
   * on cadence, stylometry (language patterns), and inferred geotemporal markers.
   */
  public static analyzeLogs(
    personaId: string,
    targetId: string,
    logs: ActivityLogEntry[]
  ): Omit<AdvancedPersonaProfile, 'id' | 'timestamp'> {
    if (!logs || logs.length === 0) {
      return this.generateDefaultProfile(personaId, targetId);
    }

    // 1. Analyze circadian rhythm & activity cadence
    const hourlyDistribution = new Array<number>(24).fill(0);
    const weeklyDistribution = [
      { day: 'Mon', activity: 0 },
      { day: 'Tue', activity: 0 },
      { day: 'Wed', activity: 0 },
      { day: 'Thu', activity: 0 },
      { day: 'Fri', activity: 0 },
      { day: 'Sat', activity: 0 },
      { day: 'Sun', activity: 0 }
    ];

    logs.forEach(log => {
      const d = new Date(log.timestamp);
      if (!isNaN(d.getTime())) {
        const hour = d.getUTCHours();
        const dayIdx = (d.getUTCDay() + 6) % 7; // Map Sun=0, Mon=1 to Mon=0, Sun=6
        hourlyDistribution[hour]++;
        weeklyDistribution[dayIdx].activity++;
      }
    });

    // Normalize distributions to 0-100 scale
    const maxHourCount = Math.max(...hourlyDistribution, 1);
    const normalizedHourly = hourlyDistribution.map(val => Math.round((val / maxHourCount) * 100));

    const maxDayCount = Math.max(...weeklyDistribution.map(w => w.activity), 1);
    const normalizedWeekly = weeklyDistribution.map(w => ({
      day: w.day,
      activity: Math.round((w.activity / maxDayCount) * 100)
    }));

    // Ingest Geotemporal Inferences
    const peakWindows = this.calculatePeakWindows(normalizedHourly);
    const offsetInference = this.inferUtcOffset(normalizedHourly);
    const dormancyInference = this.calculateDormancyPeriod(normalizedHourly);

    // 2. Perform advanced stylometric analysis
    const stylometrics = this.analyzeStylometry(logs.map(l => l.content));

    // 3. Estimate OPSEC hygiene
    const opsecInfo = this.evaluateOpsecMaturity(logs);

    // Assemble unified behavioral model
    return {
      targetId,
      personaId,
      identifiers: {
        usernames: this.extractUsernames(logs),
        emails: this.extractEmails(logs),
        pgpFingerprints: this.extractPgpFingerprints(logs),
        wallets: this.extractCryptoWallets(logs)
      },
      stylometricAnalysis: {
        writingStyle: stylometrics.writingStyle,
        vocabulary: stylometrics.vocabulary,
        sentiment: stylometrics.sentiment,
        lexicalDiversity: Number(stylometrics.lexicalDiversity.toFixed(3)),
        formalityIndex: Math.round(stylometrics.formalityIndex),
        syntacticComplexity: stylometrics.syntacticComplexity,
        punctuationHabits: stylometrics.punctuationHabits,
        dialectMarkers: stylometrics.dialectMarkers,
        loanwordsAndJargon: stylometrics.loanwordsAndJargon,
        characteristicPhrases: stylometrics.characteristicPhrases,
        sentimentStability: stylometrics.sentimentStability
      },
      behavioralSignature: {
        activityCadence: this.determineCadencePattern(normalizedHourly, normalizedWeekly),
        timezoneInference: `Inferred Offset UTC${offsetInference >= 0 ? '+' : ''}${offsetInference}:00 (${offsetInference === 3 ? 'Moscow/East Africa' : offsetInference === 8 ? 'China/Singapore' : offsetInference === 0 ? 'GMT/UTC' : 'Custom Shift'})`,
        regionalIndicators: stylometrics.dialectMarkers.join(', ') || 'Global OSINT Baseline',
        operationalSecurity: opsecInfo.operationalSecurity,
        hourlyDistribution: normalizedHourly,
        weeklyDistribution: normalizedWeekly,
        cadencePattern: this.determineCadencePattern(normalizedHourly, normalizedWeekly),
        peakWindows,
        circadianRhythm: `Active shift peaking between ${peakWindows.join(' & ')}`,
        inactivityDormancy: dormancyInference,
        primaryUtcOffset: offsetInference,
        timezoneConfidence: Math.round(opsecInfo.timezoneConfidence),
        secondaryCandidateOffsets: [`UTC+${(offsetInference + 12) % 12}`, `UTC${offsetInference - 1}`],
        localeConventions: {
          dateFormat: offsetInference >= 1 && offsetInference <= 4 ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
          numberFormat: '1.234,56 (European System)',
          keyboardArtifacts: offsetInference === 3 || offsetInference === 4 ? 'Cyrillic Layout mapping traces' : 'Standard ANSI QWERTY layout',
          colloquialPhrasing: stylometrics.characteristicPhrases
        },
        opsecHygieneRating: opsecInfo.opsecHygieneRating,
        signatureToolchain: opsecInfo.signatureToolchain,
        behavioralArchetype: opsecInfo.behavioralArchetype,
        operationalMaturity: opsecInfo.operationalMaturity,
        nonSensitiveSummary: `Threat actor exhibiting ${stylometrics.syntacticComplexity} syntactic patterns, utilizing standard ${opsecInfo.behavioralArchetype.toLowerCase()} toolchains, and operating within a circadian loop compatible with UTC${offsetInference >= 0 ? '+' : ''}${offsetInference}:00.`
      }
    };
  }

  /**
   * Helper to analyze linguistic indicators across aggregated texts (Stylometry)
   */
  private static analyzeStylometry(texts: string[]) {
    const combinedText = texts.join(' ');
    const words = combinedText.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const totalWords = words.length;
    
    // Lexical Diversity: Type-Token Ratio
    const uniqueWords = new Set(words);
    const lexicalDiversity = totalWords > 0 ? uniqueWords.size / totalWords : 0.65;

    // Detect dialect markers (e.g., Commonwealth vs American spellings)
    const dialectMarkers: string[] = [];
    const lowerText = combinedText.toLowerCase();
    if (/\b(colour|honour|programme|minimise|categorise|favour|analyse)\b/.test(lowerText)) {
      dialectMarkers.push('Commonwealth / UK spelling conventions');
    }
    if (/\b(color|honor|program|minimize|categorize|favor|analyze)\b/.test(lowerText)) {
      dialectMarkers.push('North American spelling conventions');
    }
    if (/\b(privyet|poka|blyat|da|nyet)\b/.test(lowerText)) {
      dialectMarkers.push('Slavic/Russian transliteration traces');
    }
    if (dialectMarkers.length === 0) {
      dialectMarkers.push('Standard International English (Neutral)');
    }

    // Detect characteristic phrases & jargon
    const characteristicPhrases: string[] = [];
    const loanwordsAndJargon: string[] = ['C2 payload', 'zero-day exploit', 'OPSEC', 'Exfiltration', 'Beaconing'];
    
    if (lowerText.includes('please find attached') || lowerText.includes('as per your request')) {
      characteristicPhrases.push('"Professional briefing language patterns"');
    }
    if (lowerText.includes('dm me') || lowerText.includes('tg channel') || lowerText.includes('payout')) {
      characteristicPhrases.push('"Cybercrime forum colloquialisms"');
    }
    if (characteristicPhrases.length === 0) {
      characteristicPhrases.push('"Technical analytical prose"');
    }

    // Measure formality index (punctuation, sentence length, capitalization)
    let formalityIndex = 50;
    const semicolons = (combinedText.match(/;/g) || []).length;
    const passiveVoiceCount = (lowerText.match(/\b(was|is|were|be|been)\s+[a-z]+ed\b/g) || []).length;
    
    formalityIndex += (semicolons * 5) + (passiveVoiceCount * 2);
    if (combinedText === combinedText.toLowerCase()) formalityIndex -= 25; // All lowercase text indicates extreme informality
    formalityIndex = Math.max(10, Math.min(95, formalityIndex));

    let syntacticComplexity = 'moderate';
    if (formalityIndex > 75) syntacticComplexity = 'high';
    else if (formalityIndex < 35) syntacticComplexity = 'low';

    return {
      writingStyle: formalityIndex > 65 ? 'Formal & Structurally Complex' : 'Casual & Direct (Cybercrime Forum Style)',
      vocabulary: lexicalDiversity > 0.6 ? 'Rich / Multi-Lingual Vocabulary' : 'Repetitive / Semi-Automated Templates',
      sentiment: formalityIndex > 55 ? 'Objective / Professional / Analytical' : 'Aggressive / Direct / Opportunistic',
      lexicalDiversity,
      formalityIndex,
      syntacticComplexity,
      punctuationHabits: semicolons > 2 ? ['Semicolon heavy coordination', 'Perfect sentence capitalization'] : ['Minimal punctuation', 'Unstructured sentence breaks'],
      dialectMarkers,
      loanwordsAndJargon,
      characteristicPhrases,
      sentimentStability: 'Stable (High Professional Restraint)'
    };
  }

  /**
   * Helper to infer the most probable UTC Offset based on active diurnal shift
   * (Diurnal shift usually centers active business routines around 09:00 - 18:00 local)
   */
  private static inferUtcOffset(hourly: number[]): number {
    // Find the contiguous 9-hour block with the maximum sum of activity weights
    let maxActivitySum = 0;
    let peakStartHour = 0;

    for (let h = 0; h < 24; h++) {
      let currentSum = 0;
      for (let offset = 0; offset < 9; offset++) {
        currentSum += hourly[(h + offset) % 24];
      }
      if (currentSum > maxActivitySum) {
        maxActivitySum = currentSum;
        peakStartHour = h;
      }
    }

    // Assume the peakStartHour maps to 09:00 local time
    // PeakStartHour(UTC) + Offset = 09:00 Local
    // Offset = 09 - PeakStartHour(UTC)
    let inferredOffset = 9 - peakStartHour;
    if (inferredOffset > 12) inferredOffset -= 24;
    if (inferredOffset < -12) inferredOffset += 24;

    return inferredOffset;
  }

  /**
   * Calculate peaks/shifts
   */
  private static calculatePeakWindows(hourly: number[]): string[] {
    const peaks: string[] = [];
    let startPeak: number | null = null;

    for (let h = 0; h <= 24; h++) {
      const idx = h % 24;
      const isAboveThreshold = hourly[idx] >= 70;

      if (isAboveThreshold && startPeak === null) {
        startPeak = idx;
      } else if (!isAboveThreshold && startPeak !== null) {
        const endPeak = (idx - 1 + 24) % 24;
        peaks.push(`${String(startPeak).padStart(2, '0')}:00 - ${String(endPeak).padStart(2, '0')}:59 UTC`);
        startPeak = null;
      }
    }

    if (peaks.length === 0) {
      return ['09:00 - 17:00 UTC'];
    }
    return peaks.slice(0, 3); // Return at most 3 peaks
  }

  /**
   * Calculate dormancy cycle
   */
  private static calculateDormancyPeriod(hourly: number[]): string {
    let minSum = Infinity;
    let startHour = 0;

    // Find the 6-hour contiguous slot with the lowest activity weights
    for (let h = 0; h < 24; h++) {
      let currentSum = 0;
      for (let offset = 0; offset < 6; offset++) {
        currentSum += hourly[(h + offset) % 24];
      }
      if (currentSum < minSum) {
        minSum = currentSum;
        startHour = h;
      }
    }

    const endHour = (startHour + 5) % 24;
    return `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00 UTC (Inferred Sleep Period)`;
  }

  /**
   * Detects the operational cadence profile (diurnal, nocturnal, or scripted)
   */
  private static determineCadencePattern(hourly: number[], weekly: { day: string; activity: number }[]): string {
    // Check if weekend activity is close to weekday activity
    const weekdayAvg = (weekly[0].activity + weekly[1].activity + weekly[2].activity + weekly[3].activity + weekly[4].activity) / 5;
    const weekendAvg = (weekly[5].activity + weekly[6].activity) / 2;

    const hourlyVariance = Math.max(...hourly) - Math.min(...hourly);

    if (hourlyVariance < 15) {
      return 'Scripted Continuous (Automated Payload)';
    }

    if (weekendAvg > weekdayAvg * 0.8) {
      return 'Opportunistic Non-Standard Operations';
    }

    return 'Diurnal Business Routine';
  }

  /**
   * Checks for specific OPSEC leakage to generate confidence & maturity ratings
   */
  private static evaluateOpsecMaturity(logs: ActivityLogEntry[]) {
    let opsecHygieneRating = 4;
    let timezoneConfidence = 80;
    const signatures: string[] = ['Cobalt Strike Beacon', 'C2 Server Profile Mappings'];

    const combinedText = logs.map(l => l.content).join(' ').toLowerCase();

    // Leakage indicators
    if (combinedText.includes('internal ip') || combinedText.includes('192.168.') || combinedText.includes('10.0.')) {
      opsecHygieneRating -= 1;
      timezoneConfidence += 5;
      signatures.push('Internal RFC1918 leakages');
    }
    if (combinedText.includes('ssh-rsa') || combinedText.includes('authorized_keys')) {
      opsecHygieneRating -= 1;
      signatures.push('Public-Key Cryptographic Artifacts');
    }
    if (combinedText.includes('dev environment') || combinedText.includes('local build')) {
      opsecHygieneRating -= 1;
      timezoneConfidence += 10;
      signatures.push('Internal Dev Environment Metadata');
    }

    let operationalSecurity = 'High Restraint / Professional OPSEC';
    let operationalMaturity = 'Advanced threat practitioner';
    let behavioralArchetype = 'Threat Group Coordinator';

    if (opsecHygieneRating <= 2) {
      operationalSecurity = 'Degraded / Weak OPSEC (Frequent metadata leaks)';
      operationalMaturity = 'Script-Kiddie / Low-Skill Opportunistic';
      behavioralArchetype = 'Uncoordinated Cyber Intruder';
    } else if (opsecHygieneRating === 3) {
      operationalSecurity = 'Standard Hygiene (Occasional operational traces)';
      operationalMaturity = 'Intermediate Operational Routine';
      behavioralArchetype = 'Initial Access Operator';
    }

    return {
      opsecHygieneRating: Math.max(1, opsecHygieneRating),
      timezoneConfidence,
      signatureToolchain: signatures,
      operationalSecurity,
      operationalMaturity,
      behavioralArchetype
    };
  }

  // Fallback profile if no logs are provided
  private static generateDefaultProfile(personaId: string, targetId: string): Omit<AdvancedPersonaProfile, 'id' | 'timestamp'> {
    return {
      targetId,
      personaId,
      identifiers: { usernames: [], emails: [], pgpFingerprints: [], wallets: [] },
      stylometricAnalysis: {
        writingStyle: 'Formal / Analytical Prose',
        vocabulary: 'Neutral Technical',
        sentiment: 'Objective',
        lexicalDiversity: 0.65,
        formalityIndex: 60,
        syntacticComplexity: 'moderate',
        punctuationHabits: [],
        dialectMarkers: ['Neutral International English'],
        characteristicPhrases: ['"No characteristic phrases available"'],
        sentimentStability: 'Stable'
      },
      behavioralSignature: {
        activityCadence: 'Diurnal Routine',
        timezoneInference: 'UTC+3:00 (Inferred)',
        operationalSecurity: 'Standard Profile Hygiene',
        hourlyDistribution: new Array<number>(24).fill(20),
        weeklyDistribution: [],
        primaryUtcOffset: 3,
        timezoneConfidence: 75,
        opsecHygieneRating: 3,
        signatureToolchain: ['OSINT Core Suite'],
        behavioralArchetype: 'Methodical Analyst'
      }
    };
  }

  // Quick regex filters for target profile identification
  private static extractUsernames(logs: ActivityLogEntry[]): string[] {
    const usernames = new Set<string>();
    const regex = /@([a-zA-Z0-9_]{3,20})\b/g;
    logs.forEach(l => {
      let m;
      while ((m = regex.exec(l.content)) !== null) {
        usernames.add(m[1]);
      }
    });
    return Array.from(usernames);
  }

  private static extractEmails(logs: ActivityLogEntry[]): string[] {
    const emails = new Set<string>();
    const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    logs.forEach(l => {
      let m;
      while ((m = regex.exec(l.content)) !== null) {
        emails.add(m[0]);
      }
    });
    return Array.from(emails);
  }

  private static extractPgpFingerprints(logs: ActivityLogEntry[]): string[] {
    const fingerprints = new Set<string>();
    const regex = /\b([0-9A-Fa-f]{4}\s*){10}\b/g;
    logs.forEach(l => {
      let m;
      while ((m = regex.exec(l.content)) !== null) {
        fingerprints.add(m[0].replace(/\s+/g, '').toUpperCase());
      }
    });
    return Array.from(fingerprints);
  }

  private static extractCryptoWallets(logs: ActivityLogEntry[]): string[] {
    const wallets = new Set<string>();
    // Matches BTC addresses (1 or 3 or bc1) and Ethereum addresses (0x)
    const btcRegex = /\b(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{39,59})\b/g;
    const ethRegex = /\b0x[a-fA-F0-9]{40}\b/g;

    logs.forEach(l => {
      let m;
      while ((m = btcRegex.exec(l.content)) !== null) {
        wallets.add(m[0]);
      }
      while ((m = ethRegex.exec(l.content)) !== null) {
        wallets.add(m[0]);
      }
    });
    return Array.from(wallets);
  }
}
