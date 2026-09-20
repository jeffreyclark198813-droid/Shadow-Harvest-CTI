import { 
  AnonymizationRule, 
  AnonymizationProfile, 
  RedactionFinding, 
  AnonymizedReportResult, 
  AnonymizedGraphResult, 
  SensitiveDataCategory, 
  RedactionMode 
} from '../types/intelligence_ops';

// Simple fast deterministic hash for tokenization
function pseudoHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase();
  return hex.padStart(6, '0').slice(0, 6);
}

// Partial masking helpers
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED_EMAIL]';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

function maskIP(ip: string): string {
  const octets = ip.split('.');
  if (octets.length === 4) {
    return `${octets[0]}.${octets[1]}.***.***`;
  }
  return '[REDACTED_IP]';
}

function maskCryptoWallet(wallet: string): string {
  if (wallet.length > 10) {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  }
  return '[REDACTED_WALLET]';
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `***-***-${digits.slice(-4)}`;
  }
  return '***-***-****';
}

function maskGeneral(text: string): string {
  if (text.length <= 4) return '****';
  return `${text[0]}***${text[text.length - 1]}`;
}

// Luhn algorithm check for Credit Cards
export function isValidLuhn(ccNum: string): boolean {
  const clean = ccNum.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(clean)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
}

// Default Rule Catalog
export const DEFAULT_ANONYMIZATION_RULES: AnonymizationRule[] = [
  {
    id: 'rule-email',
    name: 'Email Address Detection',
    description: 'Identifies standard and dark web relay email patterns',
    category: 'PII',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'HIGH',
    enabled: true,
    examples: ['target.agent@darkcorp.onion', 'analyst_99@proton.me']
  },
  {
    id: 'rule-phone',
    name: 'Telephone & Mobile Numbers',
    description: 'Detects international E.164, North American, and segmented phone numbers',
    category: 'PII',
    pattern: '(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b',
    isRegex: true,
    redactionMode: 'PARTIAL_MASK',
    severity: 'MEDIUM',
    enabled: true,
    examples: ['+1 (555) 234-5678', '800-555-0199']
  },
  {
    id: 'rule-ssn',
    name: 'National Identity & SSN',
    description: 'Matches US Social Security Numbers and standardized National Tax IDs',
    category: 'PII',
    pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    isRegex: true,
    redactionMode: 'FULL_MASK',
    severity: 'CRITICAL',
    enabled: true,
    examples: ['000-12-3456']
  },
  {
    id: 'rule-ipv4',
    name: 'IPv4 Network Addresses',
    description: 'Matches public and private IPv4 network addresses',
    category: 'INFRASTRUCTURE',
    pattern: '\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'HIGH',
    enabled: true,
    examples: ['192.168.1.105', '185.220.101.42']
  },
  {
    id: 'rule-ipv6',
    name: 'IPv6 Network Addresses',
    description: 'Matches standard and compressed IPv6 addresses',
    category: 'INFRASTRUCTURE',
    pattern: '\\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,7}:|:(?::[A-Fa-f0-9]{1,4}){1,7}\\b',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'HIGH',
    enabled: true,
    examples: ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', 'fe80::1']
  },
  {
    id: 'rule-crypto-eth',
    name: 'Ethereum & EVM Addresses',
    description: 'Detects 40-hex character Ethereum / EVM wallet addresses',
    category: 'FINANCIAL',
    pattern: '\\b0x[a-fA-F0-9]{40}\\b',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'CRITICAL',
    enabled: true,
    examples: ['0x71C8FB487070103056985F809054B52084c8a24F']
  },
  {
    id: 'rule-crypto-btc',
    name: 'Bitcoin (BTC) Addresses',
    description: 'Detects Legacy (1...), SegWit (3...), and Bech32 (bc1...) Bitcoin addresses',
    category: 'FINANCIAL',
    pattern: '\\b(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\\b',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'CRITICAL',
    enabled: true,
    examples: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq']
  },
  {
    id: 'rule-crypto-xmr',
    name: 'Monero (XMR) Addresses',
    description: 'Detects standard 95-character Monero stealth addresses',
    category: 'FINANCIAL',
    pattern: '\\b4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}\\b',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'CRITICAL',
    enabled: true,
    examples: ['44AFFq5Axm6GryMpHmgUBDGZwYOCG3GTuZaUzYFA3aGub1jG6fZUZaUzYFA3aGub1jG6fZU1234567890123456789012']
  },
  {
    id: 'rule-credit-card',
    name: 'Payment Cards / PAN',
    description: 'Matches 13-19 digit credit & debit card numbers',
    category: 'FINANCIAL',
    pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})\\b',
    isRegex: true,
    redactionMode: 'FULL_MASK',
    severity: 'CRITICAL',
    enabled: true,
    examples: ['4532-1234-5678-9012']
  },
  {
    id: 'rule-pgp-key',
    name: 'PGP / GPG Key Armor Blocks',
    description: 'Identifies ASCII-armored PGP private and public keys',
    category: 'CREDENTIAL',
    pattern: '-----BEGIN PGP (?:PUBLIC|PRIVATE) KEY BLOCK-----[\\s\\S]*?-----END PGP (?:PUBLIC|PRIVATE) KEY BLOCK-----',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'CRITICAL',
    enabled: true,
    examples: ['-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----']
  },
  {
    id: 'rule-api-secret',
    name: 'API Keys, Bearer Tokens & Hashes',
    description: 'Matches standard token assignments like Bearer eyJ..., api_key=..., secret=...',
    category: 'CREDENTIAL',
    pattern: '(?:api[_-]?key|secret|token|password|auth[_-]?token|bearer)\\s*[:=]\\s*[\'"]?([a-zA-Z0-9_\\-\\.\\/]{16,})[\'"]?',
    isRegex: true,
    redactionMode: 'FULL_MASK',
    severity: 'CRITICAL',
    enabled: true,
    examples: ['api_key=sk_live_92019485720194819385', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9']
  },
  {
    id: 'rule-mac-addr',
    name: 'MAC Hardware Addresses',
    description: 'Detects IEEE 802 MAC physical addresses',
    category: 'INFRASTRUCTURE',
    pattern: '\\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\\b',
    isRegex: true,
    redactionMode: 'PARTIAL_MASK',
    severity: 'MEDIUM',
    enabled: true,
    examples: ['00:1B:44:11:3A:B7', 'A4-5E-60-DB-99-12']
  },
  {
    id: 'rule-internal-domains',
    name: 'Internal Top-Level Domains & Hostnames',
    description: 'Matches private enterprise hostnames (.local, .corp, .internal, .lan)',
    category: 'INFRASTRUCTURE',
    pattern: '\\b[a-zA-Z0-9_-]+\\.(?:corp|internal|local|lan|priv|intra)\\b',
    isRegex: true,
    redactionMode: 'REPLACE_TOKEN',
    severity: 'HIGH',
    enabled: true,
    examples: ['vault01.corp', 'c2-relay.internal']
  }
];

// Presets
export const ANONYMIZATION_PROFILES: AnonymizationProfile[] = [
  {
    id: 'profile-tlp-clear',
    name: 'TLP:CLEAR (Public Release & Sanitized Sharing)',
    description: 'Strictly masks all PII, direct financial credentials, internal hostnames, and cryptographic secrets.',
    ruleIds: DEFAULT_ANONYMIZATION_RULES.map(r => r.id),
    defaultMode: 'FULL_MASK',
    isPreset: true
  },
  {
    id: 'profile-tlp-amber',
    name: 'TLP:AMBER (Inter-Agency Topology Preservation)',
    description: 'Tokenizes sensitive addresses and identities deterministically so analytical links and graph degrees are preserved.',
    ruleIds: DEFAULT_ANONYMIZATION_RULES.map(r => r.id),
    defaultMode: 'REPLACE_TOKEN',
    isPreset: true
  },
  {
    id: 'profile-gdpr',
    name: 'GDPR / Privacy Shield Standard',
    description: 'Enforces redaction of individual personal identifiers and payment data while retaining telemetry metrics.',
    ruleIds: ['rule-email', 'rule-phone', 'rule-ssn', 'rule-credit-card', 'rule-api-secret'],
    defaultMode: 'PARTIAL_MASK',
    isPreset: true
  }
];

export class AnonymizationEngine {
  private rules: AnonymizationRule[];
  private tokenCache: Map<string, string>;

  constructor(customRules: AnonymizationRule[] = DEFAULT_ANONYMIZATION_RULES) {
    this.rules = [...customRules];
    this.tokenCache = new Map<string, string>();
  }

  public setRules(rules: AnonymizationRule[]) {
    this.rules = [...rules];
  }

  public getRules(): AnonymizationRule[] {
    return this.rules;
  }

  public resetCache() {
    this.tokenCache.clear();
  }

  // Generates or retrieves a deterministic token for a matched value
  private getToken(category: SensitiveDataCategory, value: string, mode: RedactionMode): string {
    if (this.tokenCache.has(value)) {
      return this.tokenCache.get(value)!;
    }

    let token = '';
    const hash = pseudoHash(value);

    switch (mode) {
      case 'FULL_MASK':
        token = '██████████';
        break;
      case 'HASH_SHA256':
        token = `SHA256:${hash.toLowerCase()}...`;
        break;
      case 'PARTIAL_MASK':
        if (category === 'PII' && value.includes('@')) {
          token = maskEmail(value);
        } else if (category === 'INFRASTRUCTURE' && value.split('.').length === 4) {
          token = maskIP(value);
        } else if (category === 'FINANCIAL' && (value.startsWith('0x') || value.startsWith('bc1') || value.startsWith('1'))) {
          token = maskCryptoWallet(value);
        } else if (category === 'PII' && /\d{3}[-.]\d{3}[-.]\d{4}/.test(value)) {
          token = maskPhone(value);
        } else {
          token = maskGeneral(value);
        }
        break;
      case 'REPLACE_TOKEN':
      default:
        token = `[ANON_${category}_${hash}]`;
        break;
    }

    this.tokenCache.set(value, token);
    return token;
  }

  // Anonymizes an arbitrary text string (intelligence report, log, narrative)
  public anonymizeText(
    inputText: string, 
    activeProfile?: AnonymizationProfile | null, 
    customOverrideMode?: RedactionMode
  ): AnonymizedReportResult {
    if (!inputText) {
      return {
        originalText: '',
        redactedText: '',
        findings: [],
        redactionCount: 0,
        riskReductionScore: 100,
        categoryBreakdown: { PII: 0, FINANCIAL: 0, CREDENTIAL: 0, INFRASTRUCTURE: 0, CLASSIFIED_HANDLE: 0, CUSTOM: 0 },
        anonymizedAt: Date.now()
      };
    }

    const enabledRules = this.rules.filter(r => {
      if (!r.enabled) return false;
      if (activeProfile && !activeProfile.ruleIds.includes(r.id)) return false;
      return true;
    });

    const findings: RedactionFinding[] = [];
    const categoryBreakdown: Record<SensitiveDataCategory, number> = {
      PII: 0,
      FINANCIAL: 0,
      CREDENTIAL: 0,
      INFRASTRUCTURE: 0,
      CLASSIFIED_HANDLE: 0,
      CUSTOM: 0
    };

    // Locate all matches with their index spans
    for (const rule of enabledRules) {
      try {
        const regex = new RegExp(rule.pattern, rule.isRegex ? 'gi' : 'g');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(inputText)) !== null) {
          // If regex has a capturing group (e.g. for api_key=VALUE), use group 1
          const matchedValue = match[1] || match[0];
          if (!matchedValue || matchedValue.trim().length === 0) continue;

          // Special validation: skip credit card if Luhn fails
          if (rule.id === 'rule-credit-card' && !isValidLuhn(matchedValue)) {
            continue;
          }

          const mode = customOverrideMode || (activeProfile ? activeProfile.defaultMode : rule.redactionMode);
          const redactedValue = this.getToken(rule.category, matchedValue, mode);

          findings.push({
            id: `finding-${findings.length + 1}`,
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            matchedText: matchedValue,
            redactedText: redactedValue,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            severity: rule.severity
          });

          categoryBreakdown[rule.category] = (categoryBreakdown[rule.category] || 0) + 1;
        }
      } catch (err) {
        console.warn(`Error applying anonymization rule ${rule.name}:`, err);
      }
    }

    // Sort findings by start index ascending
    findings.sort((a, b) => a.startIndex - b.startIndex);

    // Apply replacements safely without overlapping collisions
    let redactedText = '';
    let lastIdx = 0;

    for (const f of findings) {
      if (f.startIndex < lastIdx) {
        // Overlap detected, skip secondary match to avoid mangling
        continue;
      }
      redactedText += inputText.slice(lastIdx, f.startIndex);
      redactedText += f.redactedText;
      lastIdx = f.endIndex;
    }
    redactedText += inputText.slice(lastIdx);

    // Compute Risk Reduction Score
    const weightedScore = findings.reduce((acc, f) => {
      if (f.severity === 'CRITICAL') return acc + 25;
      if (f.severity === 'HIGH') return acc + 15;
      if (f.severity === 'MEDIUM') return acc + 8;
      return acc + 3;
    }, 0);

    const riskReductionScore = Math.min(100, Math.max(10, weightedScore > 0 ? 98 : 100));

    return {
      originalText: inputText,
      redactedText,
      findings,
      redactionCount: findings.length,
      riskReductionScore,
      categoryBreakdown,
      anonymizedAt: Date.now()
    };
  }

  // Anonymizes Graph Node and Edge Topology
  public anonymizeGraph(
    nodes: any[], 
    edges: any[], 
    activeProfile?: AnonymizationProfile | null, 
    customOverrideMode: RedactionMode = 'REPLACE_TOKEN'
  ): AnonymizedGraphResult {
    const tokenMapping: Record<string, string> = {};
    let redactedCount = 0;

    const anonymizedNodes = nodes.map(node => {
      const originalLabel = String(node.label || node.id || '');
      const originalId = String(node.id || '');

      // Check if label contains PII or sensitive patterns
      const reportRes = this.anonymizeText(originalLabel, activeProfile, customOverrideMode);
      let newLabel = reportRes.redactedText;
      let newId = originalId;

      if (reportRes.findings.length > 0) {
        redactedCount += reportRes.findings.length;
        tokenMapping[originalLabel] = newLabel;
      }

      // Also tokenize ID if it was an email or wallet address
      const idRes = this.anonymizeText(originalId, activeProfile, customOverrideMode);
      if (idRes.findings.length > 0) {
        newId = idRes.redactedText;
        tokenMapping[originalId] = newId;
      }

      // Sanitize metadata fields
      const sanitizedMeta: any = {};
      if (node.metadata) {
        Object.entries(node.metadata).forEach(([k, v]) => {
          if (typeof v === 'string') {
            const metaRes = this.anonymizeText(v, activeProfile, customOverrideMode);
            sanitizedMeta[k] = metaRes.redactedText;
            if (metaRes.findings.length > 0) redactedCount += metaRes.findings.length;
          } else {
            sanitizedMeta[k] = v;
          }
        });
      }

      return {
        ...node,
        id: newId,
        label: newLabel,
        originalId: undefined, // Strip raw ID
        metadata: Object.keys(sanitizedMeta).length > 0 ? sanitizedMeta : node.metadata,
        isAnonymized: reportRes.findings.length > 0
      };
    });

    const anonymizedEdges = edges.map(edge => {
      const srcId = String(edge.source?.id || edge.source || '');
      const tgtId = String(edge.target?.id || edge.target || '');
      const rel = String(edge.relationship || edge.label || 'CONNECTED_TO');

      const relRes = this.anonymizeText(rel, activeProfile, customOverrideMode);

      return {
        ...edge,
        source: tokenMapping[srcId] || srcId,
        target: tokenMapping[tgtId] || tgtId,
        relationship: relRes.redactedText
      };
    });

    return {
      originalNodesCount: nodes.length,
      originalEdgesCount: edges.length,
      anonymizedNodes,
      anonymizedEdges,
      redactedEntitiesCount: redactedCount,
      tokenMapping,
      anonymizedAt: Date.now()
    };
  }
}

export const defaultAnonymizationEngine = new AnonymizationEngine();
