/**
 * OPERATION SHADOW HARVEST - ETHICAL AI & RESPONSIBLE OSINT GUIDELINES
 * Authoritative Governance Framework for Autonomous & Assisted Cyber Threat Intelligence
 * Version: 2026.4-GOV-ETHICS
 * Classification: PUBLIC RELEASE / OPERATIONAL STANDARD
 */

export interface PolicyArticle {
  id: string;
  articleNumber: string;
  title: string;
  shortSummary: string;
  mandate: string;
  procedures: string[];
  prohibitedActions: string[];
  verificationCriteria: string[];
  legalCrossReferences: string[];
  severityIfBreached: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PolicyPillar {
  id: string;
  pillarNumber: number;
  title: string;
  badge: string;
  iconName: string;
  description: string;
  coreObjective: string;
  articles: PolicyArticle[];
}

export interface ComplianceChecklistQuestion {
  id: string;
  pillarId: string;
  category: string;
  question: string;
  guidance: string;
  weight: number;
  riskIfFailed: string;
}

export const ETHICAL_AI_FRAMEWORK_METADATA = {
  frameworkName: "OPERATION SHADOW HARVEST Ethical AI Governance Charter",
  codeName: "OSH-ETHICS-2026",
  version: "4.2.0-LTS",
  effectiveDate: "2026-09-20",
  oversightAuthority: "Cyber Threat Intelligence Epistemic Oversight & Ethics Directorate (CTI-EOED)",
  mandateScope: "All autonomous AI reasoning engines, analyst copilot modules, multi-persona OSINT collectors, and automated graph correlation services within the Shadow Harvest runtime.",
  epistemicStandard: "Scientific Evidence-Controlled Epistemic Constitution (T0–T4 Hierarchy)",
  complianceStandard: "ISO/IEC 42001 (AI Management), NIST AI RMF 1.0, GDPR Recital 71, EU AI Act High-Risk CTI Standards, US CFAA (18 U.S.C. § 1030)"
};

export const ETHICAL_AI_PILLARS: PolicyPillar[] = [
  {
    id: 'privacy',
    pillarNumber: 1,
    title: 'Data Privacy & Proportional Minimization',
    badge: 'PRIVACY FIRST',
    iconName: 'Lock',
    description: 'Guarantees that all collection and processing strictly respects individual privacy rights, prevents dragnet surveillance, and enforces automated data hygiene.',
    coreObjective: 'Collect only what is demonstrably necessary to identify substantiated threat infrastructure, with zero collateral impact on non-combatant civilians.',
    articles: [
      {
        id: 'priv-01',
        articleNumber: 'Art. 1.1',
        title: 'Open Public-Domain Boundary Restriction',
        shortSummary: 'Collection is strictly confined to publicly accessible open-source data.',
        mandate: 'All autonomous scraping, entity profiling, and telemetry harvesting conducted under OPERATION SHADOW HARVEST must draw solely from publicly available sources without circumventing electronic access barriers, authentication gates, or proprietary paywalls.',
        procedures: [
          'Verify that all queried endpoints expose data without requiring unauthorized credential bypass.',
          'Respect domain robots.txt protocols and published rate-limiting headers on all targeted surface platforms.',
          'Explicitly log source URI, retrieval timestamp, and public accessibility verification tokens for every harvested artifact.'
        ],
        prohibitedActions: [
          'Bypassing paywalls, login walls, or multi-factor authentication via brute force, session hijacking, or credential stuffing.',
          'Exploiting zero-day or N-day vulnerabilities to gain unauthorized ingress to private databases or messaging platforms.',
          'Scraping private user directories or unindexed confidential repositories.'
        ],
        verificationCriteria: [
          'All ingested artifacts must contain a reproducible public URL or publicly verifiable cryptographic provenance signature.',
          'Zero requests logged that resulted in HTTP 401/403 bypass attempts.'
        ],
        legalCrossReferences: ['US Computer Fraud and Abuse Act (18 U.S.C. § 1030)', 'Council of Europe Budapest Convention Art. 2', 'GDPR Art. 6(1)(f)'],
        severityIfBreached: 'CRITICAL'
      },
      {
        id: 'priv-02',
        articleNumber: 'Art. 1.2',
        title: 'Automated PII Sanitization & Redaction Pipelines',
        shortSummary: 'Non-threat personal data must be immediately redacted or masked.',
        mandate: 'Whenever raw intelligence feeds capture Personally Identifiable Information (PII)—including personal national IDs, private home addresses, medical data, financial account numbers, or uninvolved family members—the AI engine must apply deterministic masking before downstream persistence.',
        procedures: [
          'Route all incoming raw textual artifacts through the local Named Entity Recognition (NER) anonymization pipeline.',
          'Replace civilian identifiers with deterministic synthetic pseudonym tokens (e.g., [REDACTED_CIVILIAN_EMAIL_042]).',
          'Maintain one-way cryptographic SHA-256 hashes of identifiers strictly for deduplication without storing plaintext keys.'
        ],
        prohibitedActions: [
          'Storing unredacted civilian PII in cleartext within persistent target intelligence records.',
          'Correlating personal private life details (sexual orientation, medical conditions, religious beliefs) with threat scores unless directly and demonstrably operationalized in verified kinetic cyberattacks.',
          'Disclosing or publishing doxed records of non-threat personnel.'
        ],
        verificationCriteria: [
          'Zero plaintext email handles or phone numbers of uninvolved third parties in export bundles.',
          'Automated validation passes via the DataAnonymizationView pipeline.'
        ],
        legalCrossReferences: ['GDPR Art. 5(1)(c) (Data Minimization)', 'California Consumer Privacy Act (CCPA/CPRA § 1798.100)', 'NIST SP 800-122'],
        severityIfBreached: 'HIGH'
      },
      {
        id: 'priv-03',
        articleNumber: 'Art. 1.3',
        title: 'Strict Purpose Limitation & Ban on Dragnet Surveillance',
        shortSummary: 'Zero indiscriminate mass collection; intelligence must bind to specific threat hypotheses.',
        mandate: 'Collection campaigns must be tethered to a legitimate cyber threat intelligence hypothesis (e.g., tracking an active botnet C2, ransomware operator, or phishing infrastructure). Indiscriminate bulk collection targeting broad demographic, geographical, or ideological groups is strictly prohibited.',
        procedures: [
          'Require an explicit operational justification and hypothesis statement prior to initiating bulk OSINT scans.',
          'Implement query boundary clamps that restrict automated crawlers to a maximum graph depth of 2 degrees from verified threat seed nodes.',
          'Audit and discard unlinked leaf nodes that exhibit zero malicious telemetry within 48 hours of discovery.'
        ],
        prohibitedActions: [
          'Running open-ended trawlers across political forums, human rights monitoring channels, or student networks.',
          'Establishing pervasive dragnet honeypots designed to intercept casual internet user browsing habits.',
          'Monetizing or sharing harvested intelligence with commercial marketing brokers.'
        ],
        verificationCriteria: [
          'Every target dossier must record an active threat hypothesis reference code.',
          'Crawl depths exceeding 2 degrees must trigger an automated compliance alert and require analyst re-authorization.'
        ],
        legalCrossReferences: ['Universal Declaration of Human Rights Art. 12', 'European Convention on Human Rights Art. 8', 'OECD Privacy Guidelines'],
        severityIfBreached: 'CRITICAL'
      },
      {
        id: 'priv-04',
        articleNumber: 'Art. 1.4',
        title: 'Ephemeral Processing & Enforced Data Retention Limits',
        shortSummary: 'Temporary intelligence caches must expire and be cryptographically expunged.',
        mandate: 'Uncorroborated, low-confidence, or non-actionable intelligence items must carry strict Time-To-Live (TTL) parameters. When data reaches end-of-life or an asset is cleared of malicious association, cryptographic shredding must occur across all local and indexed layers.',
        procedures: [
          'Assign default TTLs: 30 days for unverified T2 inferences; 90 days for inactive targets; 365 days for corroborated T3 threat dossiers.',
          'Execute automated garbage collection sweeps to purge expired raw query buffers.',
          'Provide an analyst-triggered "Emergency Purge" protocol to sanitize compromised target workspaces instantly.'
        ],
        prohibitedActions: [
          'Indefinite retention of unverified suspicion reports or unconfirmed persona links.',
          'Circumventing data purge routines through unmonitored shadow backups or untracked local mirrors.'
        ],
        verificationCriteria: [
          'Audit logs confirm automatic execution of TTL purges according to schedule.',
          'Cryptographic deletion certificates generated for archived target records.'
        ],
        legalCrossReferences: ['GDPR Art. 5(1)(e) (Storage Limitation)', 'ISO/IEC 27001 Control A.8.10 (Information Deletion)'],
        severityIfBreached: 'MEDIUM'
      }
    ]
  },
  {
    id: 'bias',
    pillarNumber: 2,
    title: 'Unbiased Analysis & Epistemic Calibration',
    badge: 'OBJECTIVE INTELLIGENCE',
    iconName: 'Scale',
    description: 'Enforces scientific objectivity, counteracts cognitive and algorithmic biases, and separates empirical observations from probabilistic speculation.',
    coreObjective: 'Ensure threat assessments represent rigorous, verifiable truth rather than amplified prejudices, geopolitical assumptions, or LLM hallucinations.',
    articles: [
      {
        id: 'bias-01',
        articleNumber: 'Art. 2.1',
        title: 'Epistemic Level Separation (T0–T4 Hierarchy)',
        shortSummary: 'Observations, derivations, inferences, assessments, and decisions must never be conflated.',
        mandate: 'All analytical outputs generated by AI agents must explicitly tag each statement with its strict epistemic level: T0 (Raw Observation), T1 (Deterministic Derivation), T2 (Probabilistic Inference), T3 (Synthesized Assessment), or T4 (Policy Decision). High-order inferences must never be passed off as raw facts.',
        procedures: [
          'Prepend every intelligence claim in reports with its epistemic identifier (e.g., [T0-OBS] vs [T2-INF]).',
          'Calculate confidence scores mathematically based on empirical witness count, source diversity, and algorithmic error margins.',
          'Block automated transitions from T2 inferences directly to T4 operational blocks without intermediate T3 evidence-weighted review.'
        ],
        prohibitedActions: [
          'Presenting probabilistic model predictions as verified historical events.',
          'Upgrading confidence scores artificially to satisfy operational pressure or alarmist reporting.',
          'Concealing low confidence scores behind emphatic natural language phrasing (e.g., "undoubtedly", "proven beyond doubt").'
        ],
        verificationCriteria: [
          '100% of claims in generated intelligence briefs carry an audit-traceable Epistemic Tag.',
          'Confidence scores are mathematically bound to empirical lineage.'
        ],
        legalCrossReferences: ['Kent Doctrine of Intelligence Analysis (Sherman Kent)', 'ICD 203 (Analytic Standards)', 'EU AI Act Art. 13 (Transparency)'],
        severityIfBreached: 'HIGH'
      },
      {
        id: 'bias-02',
        articleNumber: 'Art. 2.2',
        title: 'Analysis of Competing Hypotheses (ACH) Mandate',
        shortSummary: 'Every major threat attribution must evaluate at least 3 alternative explanations.',
        mandate: 'Prior to attributing a cyber incident or threat infrastructure to a specific named threat actor, nation-state, or criminal syndicate, the AI synthesizer must systematically generate, weight, and evaluate at least three distinct competing hypotheses, explicitly including the possibility of false-flag deception and coincidental overlap.',
        procedures: [
          'Mandate the ACH matrix execution in AttributionEngineView for all confidence ratings above 60%.',
          'Specifically evaluate: Hypothesis A (Targeted Actor), Hypothesis B (False-Flag / Mimicry / Tool Reuse), and Hypothesis C (Benign / Dual-Use / Shared Infrastructure).',
          'Disclose all disconfirming evidence with equal typographic prominence to supporting evidence.'
        ],
        prohibitedActions: [
          'Monopolistic single-hypothesis attribution reporting.',
          'Suppressing contradictory network telemetry, reverse-engineering notes, or alternative time-zone indicators.',
          'Ignoring the prevalence of open-source commodity tools (e.g., Cobalt Strike, Mimikatz) as confounding attribution factors.'
        ],
        verificationCriteria: [
          'Attribution reports must contain an intact ACH table with explicit disconfirming metrics.',
          'Analyst must certify consideration of alternative hypotheses before final sign-off.'
        ],
        legalCrossReferences: ['Richards J. Heuer Jr. (Psychology of Intelligence Analysis)', 'ICD 205 (Analytic Outreach)'],
        severityIfBreached: 'HIGH'
      },
      {
        id: 'bias-03',
        articleNumber: 'Art. 2.3',
        title: 'Mitigation of Geopolitical, Cultural & Demographic Bias',
        shortSummary: 'Prevent nationality-based prejudice or cultural stereotypes from biasing threat scores.',
        mandate: 'The AI model shall not assign threat indicators, malicious intent, or elevated baseline risk purely on the basis of geographic origin, server location, language encoding, or demographic associations in the absence of verified malicious indicators of compromise (IOCs).',
        procedures: [
          'Audit prompt templates to ensure neutral, standardized elicitation criteria regardless of autonomous system origin (ASNs, TLDs).',
          'Implement temperature controls and deterministic sampling in LLM inference calls to prevent speculative stereotyping.',
          'Conduct periodic statistical distribution checks across attributed actors to detect algorithmic bias skews.'
        ],
        prohibitedActions: [
          'Flagging all traffic from specific countries or TLDs (e.g., .ru, .cn, .ir) as intrinsically malicious without corroborating anomalous behavior.',
          'Using derogatory, politically biased, or sensationalist descriptors in official intelligence summaries.',
          'Biasing entity resolution algorithms against non-Latin script handles or international naming conventions.'
        ],
        verificationCriteria: [
          'Zero rule-based heuristics that trigger high-severity alerts solely on country code or ASN origin without behavioral IOCs.',
          'Regular parity audits verifying equal evidentiary standards across all global regions.'
        ],
        legalCrossReferences: ['EU AI Act Art. 10 (Data Governance & Bias Mitigation)', 'NIST SP 1270 (Towards a Standard for Identifying and Managing Bias in AI)'],
        severityIfBreached: 'HIGH'
      },
      {
        id: 'bias-04',
        articleNumber: 'Art. 2.4',
        title: 'Anti-Hallucination & Verifiable Grounding Protocols',
        shortSummary: 'Every analytical assertion must link to verifiable ground-truth citations.',
        mandate: 'AI-generated intelligence outputs must never inject fabricated CVE numbers, synthetic IOCs, hallucinated domain registrations, or imaginary malware family lineage. Every fact claim must resolve to an authentic recorded observation in the telemetry cache.',
        procedures: [
          'Execute automated citation check: verify that all mentioned IP addresses, CVEs, and hashes exist in the active evidence graph.',
          'Deploy grounding verification filters that intercept and flag unreferenced threat claims prior to UI presentation.',
          'Display confidence error bars and explicit "Unknown / Unresolved" indicators where telemetry is sparse.'
        ],
        prohibitedActions: [
          'Allowing the AI engine to generate speculative malware hashes or unverified CVE references without retrieval-augmented grounding.',
          'Filling in gaps in broken network traces with synthetic guesses without explicit [SPECULATIVE_GAP_FILL] labeling.'
        ],
        verificationCriteria: [
          '100% of mentioned CVEs validate against the National Vulnerability Database (NVD) schema.',
          'Automated validation checks catch zero orphaned IOC citations.'
        ],
        legalCrossReferences: ['ISO/IEC 23894 (AI Risk Management)', 'NIST Cybersecurity Framework v2.0'],
        severityIfBreached: 'CRITICAL'
      }
    ]
  },
  {
    id: 'sensitive_data',
    pillarNumber: 3,
    title: 'Responsible & Legal Handling of Sensitive Information',
    badge: 'CLASSIFIED PROTOCOLS',
    iconName: 'ShieldAlert',
    description: 'Defines strict custody protocols, data tiering, whistleblower protections, and legal compliance boundaries for high-sensitivity intelligence.',
    coreObjective: 'Handle dangerous, confidential, or legally precarious threat artifacts with military-grade provenance and zero risk of unauthorized leakage or legal jeopardy.',
    articles: [
      {
        id: 'sens-01',
        articleNumber: 'Art. 3.1',
        title: 'Four-Tier Intelligence Classification Scheme',
        shortSummary: 'All data items must be assigned a clear handling classification upon ingest.',
        mandate: 'Every ingested artifact, correlation edge, and synthesized report must be categorized into one of four mandatory security handling tiers, determining its storage, replication, and export permissions.',
        procedures: [
          'Tier 1 (Public OSINT): Freely shareable, derived entirely from public records, WHOIS, open repos, and surface web.',
          'Tier 2 (Controlled Threat Intel): Sensitive IOCs, unpatched vulnerabilities, and infrastructure fingerprints; exportable to verified defense partners.',
          'Tier 3 (Restricted Legal/Pvt): Compromised credentials, internal infrastructure maps, and dual-authorization assets; strictly encrypted with role-gated access.',
          'Tier 4 (Prohibited / Contraband): Intercepted private citizen communications, unredacted stolen credit card batches, child exploitation material, or illegally obtained wiretaps; mandatory purge and immediate referral to authorized legal channels.'
        ],
        prohibitedActions: [
          'Downgrading classification tags without formal cryptographic declassification audit.',
          'Retaining Tier 4 prohibited contraband under any analytical pretext.',
          'Exporting Tier 3 restricted data to unverified external integrations.'
        ],
        verificationCriteria: [
          'Every record in dbService contains an immutable classificationTier attribute.',
          'Access to Tier 3 records requires verified admin credentials.'
        ],
        legalCrossReferences: ['NIST SP 800-88 (Media Sanitization)', 'Traffic Light Protocol (TLP v2.0 - FIRST)'],
        severityIfBreached: 'CRITICAL'
      },
      {
        id: 'sens-02',
        articleNumber: 'Art. 3.2',
        title: 'Cryptographic Chain-of-Custody & Tamper-Evident Provenance',
        shortSummary: 'Every analytical step must maintain an unbroken cryptographic lineage audit log.',
        mandate: 'To ensure legal admissibility and epistemic integrity, every modification, correlation link, analyst annotation, and AI inference must be recorded in an append-only, tamper-evident provenance ledger with SHA-256 hash chaining.',
        procedures: [
          'Record parent node IDs, transformation algorithms, analyst UID, and cryptographic digest on all new graph nodes.',
          'Store provenance records in the ProvenanceModal state machine with immutable timestamps.',
          'Enable external integrity verification through STIX 2.1 JSON export bundles that preserve provenance markers.'
        ],
        prohibitedActions: [
          'Modifying historical intelligence records in-place without generating a new revision ledger entry.',
          'Deleting audit log traces or altering attribution timestamps retroactively.'
        ],
        verificationCriteria: [
          'All target nodes validate successfully against the ProvenanceModal chain-of-custody validator.',
          'Exported STIX bundles contain complete object-marking-refs and identity lineages.'
        ],
        legalCrossReferences: ['Federal Rules of Evidence (FRE 902(13) & 902(14) - Electronic Evidence)', 'ISO/IEC 27037 (Digital Evidence Handling)'],
        severityIfBreached: 'HIGH'
      },
      {
        id: 'sens-03',
        articleNumber: 'Art. 3.3',
        title: 'Journalistic, Academic & Whistleblower Safe Harbor',
        shortSummary: 'Protect public-interest disclosures, legitimate researchers, and press freedoms.',
        mandate: 'Intelligence operations must respect the protected status of bona fide security researchers, investigative journalists, whistleblowers, and civil rights defenders. Data originating from verified public-interest disclosures must be handled with heightened source protection protocols.',
        procedures: [
          'Maintain an exempt entity registry for verified non-profit threat research organizations (e.g., Citizen Lab, Bellingcat, EFF).',
          'Prevent automated attribution engines from classifying investigative reporting activities as cyber threat campaigns.',
          'Implement cryptographic source pseudonymization for sensitive informant disclosures.'
        ],
        prohibitedActions: [
          'Targeting journalists, political dissidents, or academic researchers for passive surveillance or persona infiltration.',
          'Using SHADOW HARVEST tooling to de-anonymize lawful whistleblowers exercising protected legal disclosure rights.'
        ],
        verificationCriteria: [
          'Zero monitored targets classified as protected civil society entities without explicit supervisory override.',
          'Clear audit records showing adherence to safe-harbor guidelines.'
        ],
        legalCrossReferences: ['EU Directive 2019/1937 (Whistleblower Protection)', 'US Defend Trade Secrets Act (DTSA Whistleblower Immunity)', 'UN Human Rights Resolution 20/8'],
        severityIfBreached: 'CRITICAL'
      },
      {
        id: 'sens-04',
        articleNumber: 'Art. 3.4',
        title: 'Responsible Vulnerability & Credential Disclosure (CVD)',
        shortSummary: 'Exposed vulnerabilities and credentials must follow responsible coordinated disclosure.',
        mandate: 'When passive OSINT operations reveal exposed credentials, open databases, or zero-day vulnerabilities affecting innocent third-party infrastructure, analysts must follow Coordinated Vulnerability Disclosure (CVD) procedures rather than weaponizing or hoarding findings.',
        procedures: [
          'Notify affected infrastructure administrators through standard security contacts (security.txt, CERT/CC, or national CSIRTs).',
          'Enforce a minimum 90-day embargo prior to publishing technical vulnerability details.',
          'Redact live credentials immediately to prevent unauthorized third-party exploitation.'
        ],
        prohibitedActions: [
          'Weaponizing discovered vulnerabilities or selling zero-day leads to commercial exploit brokers.',
          'Publicly disclosing unpatched security vulnerabilities without prior coordination with the affected vendor or CERT.',
          'Testing the depth of an exposed vulnerability (e.g., dumping databases to "verify" vulnerability existence).'
        ],
        verificationCriteria: [
          'All discovered vulnerabilities carry an active CVD tracking ticket or CERT coordination reference.',
          'Zero exploitation payloads logged in system telemetry.'
        ],
        legalCrossReferences: ['ISO/IEC 29147 (Vulnerability Disclosure)', 'ISO/IEC 30111 (Vulnerability Handling Processes)', 'FIRST CVD Guidelines'],
        severityIfBreached: 'CRITICAL'
      }
    ]
  },
  {
    id: 'osint_rules',
    pillarNumber: 4,
    title: 'Adherence to OSINT Principles & International Cyber Law',
    badge: 'LEGAL BOUNDARIES',
    iconName: 'Compass',
    description: 'Defines the non-negotiable boundaries of open-source intelligence tradecraft, passive reconnaissance, and international legal compliance.',
    coreObjective: 'Conduct high-impact threat intelligence operations strictly within the bounds of international law, avoiding any form of offensive hacking or unlawful interference.',
    articles: [
      {
        id: 'osint-01',
        articleNumber: 'Art. 4.1',
        title: 'Strict Passive Reconnaissance Mandate',
        shortSummary: 'Reconnaissance must remain purely passive; no active intrusion or disruption.',
        mandate: 'OPERATION SHADOW HARVEST is an intelligence collection and analytical platform, not an offensive cyber weapon. Under no circumstances may automated modules transmit destructive exploit payloads, initiate denial-of-service disruptions, or modify remote system configurations.',
        procedures: [
          'Restrict automated scanners to standard non-intrusive network queries (DNS resolution, SSL certificate inspection, HTTP headers, public WHOIS).',
          'Cap connection frequencies to avoid triggering operational stress or denial-of-service on scanned infrastructure.',
          'Enforce strict isolation between threat visualization layers and any external network socket operations.'
        ],
        prohibitedActions: [
          'Injecting SQL, XSS, or remote code execution (RCE) test payloads into targets.',
          'Executing automated brute-force attacks against target login portals.',
          'Deploying beaconing payloads or implants onto adversary infrastructure.'
        ],
        verificationCriteria: [
          'Scanner log audits show 100% compliant read-only HTTP GET, DNS, and TLS handshake operations.',
          'Zero active state-changing HTTP POST/PUT/DELETE requests directed at target infrastructure.'
        ],
        legalCrossReferences: ['Tallinn Manual 2.0 on the International Law Applicable to Cyber Operations (Rule 66)', 'CFAA 18 U.S.C. § 1030(a)(5)(A)'],
        severityIfBreached: 'CRITICAL'
      },
      {
        id: 'osint-02',
        articleNumber: 'Art. 4.2',
        title: 'Platform Terms of Service & API Rate Respect',
        shortSummary: 'Respect third-party platform API terms, quotas, and crawl rate restrictions.',
        mandate: 'All OSINT queries dispatched to social media platforms, code repositories, threat intelligence feeds, and search engines must operate within the published terms of service, developer agreements, and technical rate limits of the respective platform.',
        procedures: [
          'Honor the RateLimitAlert thresholds and backoff cadences implemented across all collector services.',
          'Utilize official registered API endpoints with legitimate authorization tokens where available.',
          'Implement exponential backoff and jitter algorithms to prevent service degradation.'
        ],
        prohibitedActions: [
          'Spinning up automated proxy botnets to circumvent platform scraping bans or IP captchas.',
          'Violating platform API developer agreements through unauthorized reselling or syndication of retrieved data.'
        ],
        verificationCriteria: [
          'RateLimitAlert component monitors zero unhandled HTTP 429 quota exhaustion spikes.',
          'Active integration modules adhere to respective API developer guidelines.'
        ],
        legalCrossReferences: ['HiQ Labs v. LinkedIn Corp. (9th Cir. 2022)', 'Meta v. BrandTotal (N.D. Cal. 2022)'],
        severityIfBreached: 'MEDIUM'
      },
      {
        id: 'osint-03',
        articleNumber: 'Art. 4.3',
        title: 'Investigative Persona ("Sockpuppet") Code of Conduct',
        shortSummary: 'Investigative personas are for observation only; zero entrapment or impersonation of real citizens.',
        mandate: 'When operational personas are deployed across forums, social platforms, or dark web networks, they must operate under strict non-engagement rules. Personas must never incite, entrap, provoke, or deceive individuals into committing illegal acts.',
        procedures: [
          'Enforce strict read-only observation protocols for all persona profiles generated in PersonaProfilingView.',
          'Ensure persona profiles utilize synthetically generated avatar images and fictional identifiers that do not mimic real living private citizens.',
          'Record all persona communications in an immutable compliance ledger subject to supervisory review.'
        ],
        prohibitedActions: [
          'Impersonating a real, living, non-consenting person (stolen identity persona).',
          'Entrapping forum members by soliciting cyberattacks, buying illegal firearms, or encouraging kinetic crimes.',
          'Initiating direct private messaging communications that simulate romantic or manipulative relationships.'
        ],
        verificationCriteria: [
          '100% of persona avatars pass the synthetic non-real human image verification check.',
          'Zero outbound entrapment prompts logged in the persona interaction history.'
        ],
        legalCrossReferences: ['DOJ Guidelines for Cybercrime Investigations (Section III - Online Personas)', 'Attorney General Guidelines for Domestic FBI Operations (DIOG)'],
        severityIfBreached: 'CRITICAL'
      }
    ]
  },
  {
    id: 'hitl_governance',
    pillarNumber: 5,
    title: 'Human-in-the-Loop (HITL) Governance & Accountability',
    badge: 'HUMAN OVERSIGHT',
    iconName: 'Users',
    description: 'Mandates meaningful human oversight, non-autonomous operational escalation, and contestability for all AI-assisted recommendations.',
    coreObjective: 'Ensure that no punitive, operational, legal, or defensive action is enacted without an authenticated human analyst making an informed, accountable decision.',
    articles: [
      {
        id: 'hitl-01',
        articleNumber: 'Art. 5.1',
        title: 'Mandatory Human Sign-Off for Operational Actions',
        shortSummary: 'AI provides decision-support only; humans maintain sole execution authority.',
        mandate: 'The AI orchestration engine operates exclusively in an advisory, diagnostic, and decision-support capacity. Automated operational escalations—such as submitting external law enforcement referrals, executing DNS sinkholing, or notifying upstream telecom carriers—strictly require deliberate, authenticated human analyst sign-off.',
        procedures: [
          'Enforce an explicit human approval dialog in the UI before any T4 Decision artifact can trigger external webhooks.',
          'Require multi-factor authentication or cryptographic role verification for high-impact target modifications.',
          'Display the exact evidentiary basis and confidence breakdown alongside every action approval request.'
        ],
        prohibitedActions: [
          'Configuring autonomous end-to-end loops where AI initiates retaliatory cyber maneuvers or external takedown notices without human review.',
          'Automating legal subpoenas, takedown demands, or criminal accusations without licensed counsel or authorized analyst verification.'
        ],
        verificationCriteria: [
          'Every T4 action entry in dbService includes an authenticated human analyst user ID.',
          'Audit trail confirms no external operational API calls were executed without prior UI confirmation.'
        ],
        legalCrossReferences: ['EU AI Act Art. 14 (Human Oversight)', 'DoD Directive 3000.09 (Autonomy in Weapon Systems - Analogous CTI Standard)'],
        severityIfBreached: 'CRITICAL'
      },
      {
        id: 'hitl-02',
        articleNumber: 'Art. 5.2',
        title: 'Analytical Contestability & Hypothesis Override',
        shortSummary: 'Analysts must always have the tools to challenge, modify, or override AI assessments.',
        mandate: 'Analysts must never be subordinated to algorithmic outputs. The user interface must provide intuitive, immediate mechanisms for human analysts to correct misidentifications, contest confidence ratings, inject dissenting opinions, and adjust graph topology.',
        procedures: [
          'Provide one-click "Contest Assessment" capabilities on all threat synthesis widgets.',
          'Retain both the original AI recommendation and the analyst override in the permanent telemetry ledger for model learning and oversight audits.',
          'Flag any discrepancy between AI rating and analyst override for review during periodic team intelligence reviews.'
        ],
        prohibitedActions: [
          'Locking UI controls to prevent human correction of false-positive entity links.',
          'Penalizing analysts or suppressing dissident analytical hypotheses in automated reporting pipelines.'
        ],
        verificationCriteria: [
          'UI features active override controls across all threat, persona, and correlation views.',
          'Lineage records preserve both original AI output and analyst overrides with full attribution.'
        ],
        legalCrossReferences: ['GDPR Art. 22(3) (Right to Contest Automated Decisions)', 'NIST AI RMF (Govern 1.2 & Map 1.5)'],
        severityIfBreached: 'HIGH'
      },
      {
        id: 'hitl-03',
        articleNumber: 'Art. 5.3',
        title: 'Continuous Ethics Audits & Algorithmic Impact Reviews',
        shortSummary: 'Regular independent reviews of CTI operational methodologies and AI accuracy.',
        mandate: 'The operational methodologies, prompt architectures, and scoring algorithms within OPERATION SHADOW HARVEST must undergo systematic bi-annual algorithmic impact assessments to detect model drift, unexpected biases, and adherence to evolving international OSINT conventions.',
        procedures: [
          'Publish versioned compliance manifests whenever system prompts or model versions are updated.',
          'Maintain an active Ethical Risk Assessment engine (EthicalRiskAssessmentView) accessible for every monitored target.',
          'Conduct quarterly adversarial resilience tests (AdversarialTestingView) to evaluate system immunity against prompt injection and biased poisoning.'
        ],
        prohibitedActions: [
          'Deploying modified LLM reasoning prompts directly to production without prior sandbox ethics evaluation.',
          'Suppressing identified ethical non-compliance incidents or failing to document corrective actions.'
        ],
        verificationCriteria: [
          'Complete audit history of prompt changes maintained in git revision records.',
          'Active compliance score calculated and monitored in the executive dashboard.'
        ],
        legalCrossReferences: ['EU AI Act Art. 9 (Risk Management System)', 'IEEE 7000-2021 (Standard Model Process for Addressing Ethical Concerns During System Design)'],
        severityIfBreached: 'MEDIUM'
      }
    ]
  }
];

export const COMPLIANCE_CHECKLIST_QUESTIONS: ComplianceChecklistQuestion[] = [
  {
    id: 'chk-01',
    pillarId: 'privacy',
    category: 'Data Privacy',
    question: 'Are all sources for this target verifiable open-source artifacts without credential-bypass or paywall circumvention?',
    guidance: 'Confirm that every URL, DNS record, or forum post was gathered from public web sources without unauthorized ingress.',
    weight: 20,
    riskIfFailed: 'Potential violation of US CFAA or Computer Misuse Acts; inadmissible evidence.'
  },
  {
    id: 'chk-02',
    pillarId: 'privacy',
    category: 'PII Minimization',
    question: 'Has civilian PII (private home addresses, uninvolved family handles, sensitive health/financial data) been automatically redacted or pseudonymized?',
    guidance: 'Run the text through the DataAnonymizationView pipeline before creating permanent intelligence dossiers.',
    weight: 15,
    riskIfFailed: 'Severe breach of GDPR Art. 5, CCPA regulations, and privacy tort liability.'
  },
  {
    id: 'chk-03',
    pillarId: 'bias',
    category: 'Epistemic Calibration',
    question: 'Are all analytical claims strictly demarcated into T0 Observation, T1 Derivation, T2 Inference, and T3 Assessment?',
    guidance: 'Verify that probabilistic inferences are explicitly labeled with confidence ranges and not presented as verified physical facts.',
    weight: 15,
    riskIfFailed: 'Analytic drift, overconfident misattribution, and loss of epistemic integrity.'
  },
  {
    id: 'chk-04',
    pillarId: 'bias',
    category: 'Alternative Hypotheses',
    question: 'Have at least three competing hypotheses (including false-flag mimicry and benign infrastructure overlap) been documented and weighted?',
    guidance: 'Execute the ACH protocol in the AttributionEngineView to ensure disconfirming evidence is accounted for.',
    weight: 15,
    riskIfFailed: 'Tunnel vision, confirmation bias, and false-positive threat actor naming.'
  },
  {
    id: 'chk-05',
    pillarId: 'sensitive_data',
    category: 'Information Classification',
    question: 'Is all ingested data properly tagged according to the Four-Tier Classification scheme with tamper-evident provenance?',
    guidance: 'Check that Tier 3/4 sensitive materials are segregated with appropriate access controls and cryptographic digests.',
    weight: 15,
    riskIfFailed: 'Uncontrolled dissemination of sensitive zero-days, credentials, or legally restricted records.'
  },
  {
    id: 'chk-06',
    pillarId: 'osint_rules',
    category: 'Passive Reconnaissance',
    question: 'Were all reconnaissance operations strictly passive (no active injection, denial-of-service, or weaponized payload testing)?',
    guidance: 'Review scanner logs to ensure only standard read-only queries (DNS, WHOIS, HTTP headers) were dispatched.',
    weight: 10,
    riskIfFailed: 'Unlawful cyber intrusion under domestic and international law.'
  },
  {
    id: 'chk-07',
    pillarId: 'hitl_governance',
    category: 'Human Oversight',
    question: 'Is a verified human analyst in the loop before any operational block, referral, or external dissemination is executed?',
    guidance: 'Ensure no autonomous bots have triggered third-party interventions or notifications without explicit human authorization.',
    weight: 10,
    riskIfFailed: 'Autonomous run-away escalation, unauthorized legal liability, and regulatory sanctions.'
  }
];
