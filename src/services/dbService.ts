import { 
  db, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Timestamp, OperationType, handleFirestoreError, doc, getDocs
} from '../firebase';

export interface Target {
  id?: string;
  name: string;
  type: 'domain' | 'ip' | 'persona' | 'wallet';
  status: 'active' | 'pending' | 'archived';
  confidenceScore: number;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  userPersonaId: string;
}

export interface IntelligenceReport {
  id?: string;
  targetId: string;
  phase: number;
  content: string;
  source: string;
  timestamp: any;
  confidence: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'N/A';
}

export interface ThreatAssessment {
  id?: string;
  targetId: string;
  capabilities: string;
  ttps: {
    tactic: string;
    technique: { id: string; name: string };
    procedure: string;
    confidence: number;
    explanation: string;
  }[];
  operationalScope: string;
  potentialTargets: string[];
  timestamp: any;
}

export interface PersonaOSINT {
  id?: string;
  targetId: string;
  personaId: string;
  socialProfiles: {
    platform: string;
    url: string;
    description: string;
    connectionsCount: number;
    recentPosts: string[];
    technicalSignatures?: string[];
  }[];
  timestamp: any;
}

export interface AdvancedPersonaProfile {
  id?: string;
  targetId: string;
  personaId: string;
  identifiers: {
    usernames: string[];
    emails: string[];
    pgpFingerprints: string[];
    wallets: string[];
  };
  stylometricAnalysis: {
    writingStyle: string;
    vocabulary: string;
    sentiment: string;
  };
  behavioralSignature: {
    activityCadence: string;
    timezoneInference: string;
    regionalIndicators?: string;
    operationalSecurity: string;
  };
  timestamp: any;
}

export interface AttributionReport {
  id?: string;
  targetId: string;
  summary: string;
  geotemporalAnalysis: string;
  behavioralCorrelations: string;
  confidenceScore: number;
  likelyAttribution: string;
  timestamp: any;
}

export interface MonitoringEvent {
  id?: string;
  targetId: string;
  type: 'wallet_activity' | 'credential_leak' | 'infra_change' | 'forum_mention';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dataHash: string;
  timestamp: any;
}

export interface UserPersona {
  id?: string;
  userId: string;
  name: string;
  avatar: string;
  backstory: string;
  stats: {
    hacking: number;
    socialEngineering: number;
    cryptography: number;
    stealth: number;
  };
  privacySettings: {
    vpnEnabled: boolean;
    torRouting: boolean;
    dataSharingLevel: 'none' | 'minimal' | 'full';
    encryptedStorage: boolean;
    metadataScrubbing: boolean;
    advancedFingerprintMasking: boolean;
    ephemeralChannels: boolean;
    secureDataStorageProtocols: boolean;
  };
  anonymityScore: {
    value: number;
    breakdown: { [key: string]: number };
  };
  level: number;
  xp: number;
}

export interface UserAchievement {
  id: string;
  unlockedAt: number;
}

export interface UserSettings {
  activePersonaId: string;
  role?: 'admin' | 'moderator' | 'user';
  username?: string;
  avatar?: string;
  bio?: string;
  achievements?: UserAchievement[];
  stats?: {
    actionsTaken: number;
    targetsViewed: number;
  };
}

export interface NarrativeEvent {
  id?: string;
  targetId?: string;
  title: string;
  description: string;
  type: 'opportunity' | 'threat' | 'challenge';
  impact: string;
  choices: {
    label: string;
    consequence: string;
  }[];
  resolved: boolean;
  timestamp: any;
}

export interface AIPersona {
  id?: string;
  userId: string;
  name: string;
  personality: string;
  knowledgeDomains: string[];
  tone: string;
  isDefault: boolean;
  createdAt: any;
}

export interface SynthesizedOutput {
  id?: string;
  targetId: string;
  title: string;
  format: 'summary' | 'report' | 'comparison';
  content: string;
  focusAreas: string[];
  timestamp: any;
}

export interface EntityNode {
  id?: string;
  targetId: string;
  label: string;
  type: string;
  location?: {
    lat: number;
    lng: number;
    country: string;
  };
  metadata: any;
}

export interface EntityEdge {
  id?: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  confidence: number;
}

export interface Anomaly {
  id?: string;
  targetId: string;
  type: 'network' | 'user_activity' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  timestamp: any;
  resolved?: boolean;
}

export const createTarget = async (target: Omit<Target, 'id' | 'createdAt' | 'updatedAt'>) => {
  const path = 'targets';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...target,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteTarget = async (id: string) => {
  const path = 'targets';
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToTargets = (uid: string, personaId: string | null, callback: (targets: Target[]) => void) => {
  const path = 'targets';
  let q = query(collection(db, path), where('createdBy', '==', uid));
  if (personaId) {
    q = query(collection(db, path), where('createdBy', '==', uid), where('userPersonaId', '==', personaId));
  }
  return onSnapshot(q, (snapshot) => {
    const targets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Target));
    callback(targets);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addReport = async (report: Omit<IntelligenceReport, 'id' | 'timestamp'>) => {
  const path = `targets/${report.targetId}/reports`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...report,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToReports = (targetId: string, callback: (reports: IntelligenceReport[]) => void) => {
  const path = `targets/${targetId}/reports`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IntelligenceReport));
    callback(reports);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addThreatAssessment = async (assessment: Omit<ThreatAssessment, 'id' | 'timestamp'>) => {
  const path = `targets/${assessment.targetId}/threat_assessments`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...assessment,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToThreatAssessments = (targetId: string, callback: (assessments: ThreatAssessment[]) => void) => {
  const path = `targets/${targetId}/threat_assessments`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThreatAssessment));
    callback(assessments);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addMonitoringEvent = async (event: Omit<MonitoringEvent, 'id' | 'timestamp'>) => {
  const path = `targets/${event.targetId}/monitoring_events`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...event,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToMonitoringEvents = (targetId: string, callback: (events: MonitoringEvent[]) => void) => {
  const path = `targets/${targetId}/monitoring_events`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonitoringEvent));
    callback(events);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveUserPersona = async (persona: UserPersona) => {
  const path = `users/${persona.userId}/personas`;
  try {
    if (persona.id) {
      await updateDoc(doc(db, path, persona.id), { ...persona });
    } else {
      const docRef = await addDoc(collection(db, path), { ...persona });
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToUserPersonas = (userId: string, callback: (personas: UserPersona[]) => void) => {
  const path = `users/${userId}/personas`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const personas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserPersona));
    callback(personas);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveUserSettings = async (userId: string, settings: UserSettings) => {
  const path = `users/${userId}/settings`;
  try {
    const { setDoc } = await import('../firebase');
    await setDoc(doc(db, path, 'main'), { ...settings }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const incrementUserStat = async (userId: string, statName: 'actionsTaken' | 'targetsViewed') => {
  const path = `users/${userId}/settings`;
  try {
    const { getDoc, setDoc, doc } = await import('../firebase');
    const docRef = doc(db, path, 'main');
    const snap = await getDoc(docRef);
    let stats = { actionsTaken: 0, targetsViewed: 0 };
    let achievements: UserAchievement[] = [];
    
    if (snap.exists()) {
      const data = snap.data() as UserSettings;
      if (data.stats) stats = { ...stats, ...data.stats };
      if (data.achievements) achievements = data.achievements;
    }

    stats[statName] += 1;
    
    // Check auto achievements
    let newlyUnlocked = false;
    if (stats.actionsTaken === 1 && !achievements.find(a => a.id === 'first_blood')) {
      achievements.push({ id: 'first_blood', unlockedAt: Date.now() });
      newlyUnlocked = true;
    }
    if (stats.actionsTaken >= 5 && !achievements.find(a => a.id === 'actions_5')) {
      achievements.push({ id: 'actions_5', unlockedAt: Date.now() });
      newlyUnlocked = true;
    }
    if (stats.targetsViewed >= 5 && !achievements.find(a => a.id === 'exploration_master')) {
      achievements.push({ id: 'exploration_master', unlockedAt: Date.now() });
      newlyUnlocked = true;
    }

    await setDoc(docRef, { stats, achievements }, { merge: true });
    
    if (newlyUnlocked) {
      // You can dispatch a custom event here if you want to show a toast globally
      window.dispatchEvent(new CustomEvent('achievement_unlocked'));
    }
  } catch (e) {
    console.error(e);
  }
};

export const unlockAchievement = async (userId: string, achievementId: string) => {
  const path = `users/${userId}/settings`;
  try {
    const { getDoc, setDoc, doc } = await import('../firebase');
    const docRef = doc(db, path, 'main');
    const snap = await getDoc(docRef);
    let achievements: UserAchievement[] = [];
    if (snap.exists() && snap.data().achievements) {
      achievements = snap.data().achievements;
    }
    
    if (!achievements.find(a => a.id === achievementId)) {
      achievements.push({ id: achievementId, unlockedAt: Date.now() });
      await setDoc(docRef, { achievements }, { merge: true });
      window.dispatchEvent(new CustomEvent('achievement_unlocked'));
    }
  } catch (e) {
    console.error(e);
  }
};

export const subscribeToUserSettings = (userId: string, callback: (settings: UserSettings | null) => void) => {
  const path = `users/${userId}/settings`;
  return onSnapshot(doc(db, path, 'main'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserSettings);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const calculateAnonymityScore = (settings: UserPersona['privacySettings']) => {
  let score = 20; // Base score
  const breakdown: { [key: string]: number } = { 'Base Identity': 20 };

  if (settings.vpnEnabled) {
    score += 15;
    breakdown['VPN Tunneling'] = 15;
  }
  if (settings.torRouting) {
    score += 25;
    breakdown['Tor Network Routing'] = 25;
  }
  if (settings.encryptedStorage) {
    score += 5;
    breakdown['Encrypted Data Vault'] = 5;
  }
  if (settings.metadataScrubbing) {
    score += 10;
    breakdown['Metadata Scrubbing'] = 10;
  }
  if (settings.advancedFingerprintMasking) {
    score += 10;
    breakdown['Fingerprint Masking'] = 10;
  }
  if (settings.ephemeralChannels) {
    score += 10;
    breakdown['Ephemeral Comms'] = 10;
  }
  if (settings.secureDataStorageProtocols) {
    score += 5;
    breakdown['Secure Protocols'] = 5;
  }
  
  if (settings.dataSharingLevel === 'none') {
    score += 10;
    breakdown['Zero Data Sharing'] = 10;
  } else if (settings.dataSharingLevel === 'minimal') {
    score += 5;
    breakdown['Minimal Data Sharing'] = 5;
  }

  return { value: Math.min(score, 100), breakdown };
};

export const addNarrativeEvent = async (event: Omit<NarrativeEvent, 'id' | 'timestamp'>) => {
  const path = event.targetId ? `targets/${event.targetId}/narrative_events` : 'global_events';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...event,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToNarrativeEvents = (targetId: string, callback: (events: NarrativeEvent[]) => void) => {
  const path = `targets/${targetId}/narrative_events`;
  const q = query(collection(db, path), where('resolved', '==', false));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NarrativeEvent));
    callback(events);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const resolveNarrativeEvent = async (targetId: string, eventId: string) => {
  const path = `targets/${targetId}/narrative_events`;
  try {
    await updateDoc(doc(db, path, eventId), { resolved: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const addPersonaOSINT = async (osint: Omit<PersonaOSINT, 'id' | 'timestamp'>) => {
  const path = `targets/${osint.targetId}/persona_osint`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...osint,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToPersonaOSINT = (targetId: string, callback: (osint: PersonaOSINT[]) => void) => {
  const path = `targets/${targetId}/persona_osint`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const osint = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonaOSINT));
    callback(osint);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addAdvancedPersonaProfile = async (profile: Omit<AdvancedPersonaProfile, 'id' | 'timestamp'>) => {
  const path = `targets/${profile.targetId}/persona_profiles`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...profile,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToAdvancedPersonaProfiles = (targetId: string, callback: (profiles: AdvancedPersonaProfile[]) => void) => {
  const path = `targets/${targetId}/persona_profiles`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdvancedPersonaProfile));
    callback(profiles);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addAttributionReport = async (report: Omit<AttributionReport, 'id' | 'timestamp'>) => {
  const path = `targets/${report.targetId}/attribution_reports`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...report,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToAttributionReports = (targetId: string, callback: (reports: AttributionReport[]) => void) => {
  const path = `targets/${targetId}/attribution_reports`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttributionReport));
    callback(reports);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addAIPersona = async (persona: Omit<AIPersona, 'id' | 'createdAt'>) => {
  const path = `users/${persona.userId}/ai_personas`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...persona,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToAIPersonas = (userId: string, callback: (personas: AIPersona[]) => void) => {
  const path = `users/${userId}/ai_personas`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const personas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIPersona));
    callback(personas);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const deleteAIPersona = async (userId: string, personaId: string) => {
  const path = `users/${userId}/ai_personas`;
  try {
    await deleteDoc(doc(db, path, personaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const addSynthesizedOutput = async (output: Omit<SynthesizedOutput, 'id' | 'timestamp'>) => {
  const path = `targets/${output.targetId}/synthesized_outputs`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...output,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToSynthesizedOutputs = (targetId: string, callback: (outputs: SynthesizedOutput[]) => void) => {
  const path = `targets/${targetId}/synthesized_outputs`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const outputs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SynthesizedOutput));
    callback(outputs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addAnomaly = async (anomaly: Omit<Anomaly, 'id' | 'timestamp'>) => {
  const path = `targets/${anomaly.targetId}/anomalies`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...anomaly,
      timestamp: Timestamp.now(),
      resolved: false
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToAnomalies = (targetId: string, callback: (anomalies: Anomaly[]) => void) => {
  const path = `targets/${targetId}/anomalies`;
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const anomalies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Anomaly));
    callback(anomalies);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const resolveAnomaly = async (targetId: string, anomalyId: string) => {
  const path = `targets/${targetId}/anomalies`;
  try {
    await updateDoc(doc(db, path, anomalyId), { resolved: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export interface UserDataBundle {
  version: string;
  timestamp: string;
  userId: string;
  settings: UserSettings | null;
  personas: UserPersona[];
  aiPersonas: AIPersona[];
  targets: (Target & {
    reports: IntelligenceReport[];
    threatAssessments: ThreatAssessment[];
    monitoringEvents: MonitoringEvent[];
    narrativeEvents: NarrativeEvent[];
    personaOSINT: PersonaOSINT[];
    personaProfiles: AdvancedPersonaProfile[];
    attributionReports: AttributionReport[];
    graphNodes: EntityNode[];
    graphEdges: EntityEdge[];
    synthesizedOutputs: SynthesizedOutput[];
    anomalies: Anomaly[];
  })[];
}

export const exportUserData = async (userId: string): Promise<UserDataBundle> => {
  const bundle: UserDataBundle = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    userId,
    settings: null,
    personas: [],
    aiPersonas: [],
    targets: []
  };

  // 1. Settings
  const settingsSnap = await getDocs(collection(db, `users/${userId}/settings`));
  const mainSettings = settingsSnap.docs.find(d => d.id === 'main');
  if (mainSettings) bundle.settings = mainSettings.data() as UserSettings;

  // 2. Personas
  const personasSnap = await getDocs(collection(db, `users/${userId}/personas`));
  bundle.personas = personasSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserPersona));

  // 3. AI Personas
  const aiPersonasSnap = await getDocs(collection(db, `users/${userId}/ai_personas`));
  bundle.aiPersonas = aiPersonasSnap.docs.map(d => ({ id: d.id, ...d.data() } as AIPersona));

  // 4. Targets and Subcollections
  const targetsSnap = await getDocs(query(collection(db, 'targets'), where('createdBy', '==', userId)));
  
  for (const targetDoc of targetsSnap.docs) {
    const targetData = { id: targetDoc.id, ...targetDoc.data() } as Target;
    const targetId = targetDoc.id;

    const subCollections = [
      'reports', 'threat_assessments', 'monitoring_events', 'narrative_events',
      'persona_osint', 'persona_profiles', 'attribution_reports',
      'graph/nodes', 'graph/edges', 'synthesized_outputs', 'anomalies'
    ];

    const results = await Promise.all(subCollections.map(sub => getDocs(collection(db, `targets/${targetId}/${sub}`))));

    bundle.targets.push({
      ...targetData,
      reports: results[0].docs.map(d => ({ id: d.id, ...d.data() } as IntelligenceReport)),
      threatAssessments: results[1].docs.map(d => ({ id: d.id, ...d.data() } as ThreatAssessment)),
      monitoringEvents: results[2].docs.map(d => ({ id: d.id, ...d.data() } as MonitoringEvent)),
      narrativeEvents: results[3].docs.map(d => ({ id: d.id, ...d.data() } as NarrativeEvent)),
      personaOSINT: results[4].docs.map(d => ({ id: d.id, ...d.data() } as PersonaOSINT)),
      personaProfiles: results[5].docs.map(d => ({ id: d.id, ...d.data() } as AdvancedPersonaProfile)),
      attributionReports: results[6].docs.map(d => ({ id: d.id, ...d.data() } as AttributionReport)),
      graphNodes: results[7].docs.map(d => ({ id: d.id, ...d.data() } as EntityNode)),
      graphEdges: results[8].docs.map(d => ({ id: d.id, ...d.data() } as EntityEdge)),
      synthesizedOutputs: results[9].docs.map(d => ({ id: d.id, ...d.data() } as SynthesizedOutput)),
      anomalies: results[10].docs.map(d => ({ id: d.id, ...d.data() } as Anomaly))
    });
  }

  return bundle;
};

export interface ConfidenceBreakdown {
  score: number;
  factors: {
    label: string;
    points: number;
    description: string;
  }[];
}

export const calculateAttributionConfidence = (
  reports: IntelligenceReport[],
  osint: PersonaOSINT[],
  profiles: AdvancedPersonaProfile[],
  events: MonitoringEvent[]
): ConfidenceBreakdown => {
  let score = 0;
  const factors: ConfidenceBreakdown['factors'] = [];

  // 1. Quantity of correlating data points
  const totalPoints = reports.length + osint.length + profiles.length + events.length;
  const quantityPoints = Math.min(totalPoints * 5, 25);
  score += quantityPoints;
  factors.push({
    label: 'Data Volume',
    points: quantityPoints,
    description: `Correlated ${totalPoints} distinct intelligence artifacts.`
  });

  // 2. Source Reliability
  const reliableSourcePoints = reports.filter(r => ['A', 'B'].includes(r.confidence)).length * 10;
  const finalSourcePoints = Math.min(reliableSourcePoints, 30);
  score += finalSourcePoints;
  factors.push({
    label: 'Source Integrity',
    points: finalSourcePoints,
    description: 'Validation of high-reliability intake channels.'
  });

  // 3. Unique Identifiers
  let uniqueIdPoints = 0;
  profiles.forEach(p => {
    if (p.identifiers.pgpFingerprints?.length > 0) uniqueIdPoints += 15;
    if (p.identifiers.wallets?.length > 0) uniqueIdPoints += 10;
    if (p.identifiers.emails?.length > 0) uniqueIdPoints += 5;
  });
  const finalUniquePoints = Math.min(uniqueIdPoints, 25);
  score += finalUniquePoints;
  factors.push({
    label: 'Identifier Uniqueness',
    points: finalUniquePoints,
    description: 'Detection of non-fungible digital signatures (PGP/Wallets).'
  });

  // 4. Behavioral Pattern Analysis
  const behavioralPoints = profiles.filter(p => 
    p.behavioralSignature.activityCadence !== 'unknown' && 
    p.stylometricAnalysis.writingStyle !== 'average'
  ).length * 10;
  const finalBehavioralPoints = Math.min(behavioralPoints, 20);
  score += finalBehavioralPoints;
  factors.push({
    label: 'Behavioral Signatures',
    points: finalBehavioralPoints,
    description: 'Alignment of stylometric and temporal activity patterns.'
  });

  return { score: Math.min(score, 100), factors };
};

export const importUserData = async (userId: string, bundle: UserDataBundle) => {
  const { setDoc, Timestamp } = await import('../firebase');

  const fixTimestamps = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    if (data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length === 2) {
      return new Timestamp(data.seconds, data.nanoseconds);
    }
    
    if (Array.isArray(data)) {
      return data.map(ix => fixTimestamps(ix));
    }
    
    const newData: any = {};
    for (const key in data) {
      newData[key] = fixTimestamps(data[key]);
    }
    return newData;
  };

  // 1. Settings
  if (bundle.settings) {
    await setDoc(doc(db, `users/${userId}/settings`, 'main'), bundle.settings);
  }

  // 2. Personas
  for (const persona of bundle.personas) {
    const { id, ...data } = persona;
    await setDoc(doc(db, `users/${userId}/personas`, id!), fixTimestamps(data));
  }

  // 3. AI Personas
  for (const aiPersona of bundle.aiPersonas) {
    const { id, ...data } = aiPersona;
    await setDoc(doc(db, `users/${userId}/ai_personas`, id!), fixTimestamps(data));
  }

  // 4. Targets
  for (const target of bundle.targets) {
    const { 
      id: targetId, reports, threatAssessments, monitoringEvents, narrativeEvents,
      personaOSINT, personaProfiles, attributionReports, graphNodes, graphEdges,
      synthesizedOutputs, anomalies, ...targetData 
    } = target;

    await setDoc(doc(db, 'targets', targetId!), { ...fixTimestamps(targetData), createdBy: userId });

    const importSub = async (col: string, items: any[]) => {
      for (const item of items) {
        const { id, ...itemData } = item;
        await setDoc(doc(db, `targets/${targetId}/${col}`, id), fixTimestamps(itemData));
      }
    };

    await Promise.all([
      importSub('reports', reports),
      importSub('threat_assessments', threatAssessments),
      importSub('monitoring_events', monitoringEvents),
      importSub('narrative_events', narrativeEvents),
      importSub('persona_osint', personaOSINT),
      importSub('persona_profiles', personaProfiles),
      importSub('attribution_reports', attributionReports),
      importSub('graph/nodes', graphNodes),
      importSub('graph/edges', graphEdges),
      importSub('synthesized_outputs', synthesizedOutputs),
      importSub('anomalies', anomalies)
    ]);
  }
};
