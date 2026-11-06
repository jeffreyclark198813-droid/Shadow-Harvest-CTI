import { 
  db, collection, addDoc, getDocs, query, limit, serverTimestamp, auth 
} from '../firebase';
import { AuditService } from './AuditService';
import { Target, AIPersona } from './dbService';

export class SystemInitializationService {
  /**
   * Ensures that the system has a baseline set of live documents.
   * This removes the need for UI-level hardcoded mocks.
   */
  public static async ensureBaseline(userId: string) {
    const initializedKey = `system_initialized_${userId}`;
    if (localStorage.getItem(initializedKey)) return;

    console.log(`[SystemInitialization] Initializing baseline for user ${userId}...`);

    try {
      // 1. Check if targets exist
      const targetsSnap = await getDocs(query(collection(db, 'targets'), limit(1)));
      if (targetsSnap.empty) {
        await this.seedBaselineTargets(userId);
      }

      // 2. Check if AI Personas exist
      const personaSnap = await getDocs(query(collection(db, `users/${userId}/ai_personas`), limit(1)));
      if (personaSnap.empty) {
        await this.seedBaselinePersonas(userId);
      }

      // 3. Seed Registry Identifiers (DAER)
      const registrySnap = await getDocs(query(collection(db, 'registry_identifiers'), limit(1)));
      if (registrySnap.empty) {
        await this.seedRegistryIdentifiers();
      }

      // 4. Log System Readiness
      await AuditService.logOperation(
        'SYSTEM_INITIALIZATION',
        'Baseline production environment reconstituted. Simulations isolated.',
        'success'
      );

      localStorage.setItem(initializedKey, 'true');
    } catch (error) {
      console.error('[SystemInitialization] Failed to initialize baseline:', error);
    }
  }

  private static async seedRegistryIdentifiers() {
    const identifiers = [
      'analyst@agency.gov', 'analyst@security.gov', 'analyst@intel.gov', 'analyst@cyber.gov',
      'analyst@defense.gov', 'analyst@justice.gov', 'analyst@state.gov', 'analyst@dhs.gov',
      'analyst@fema.gov', 'analyst@cisa.gov', 'analyst@treasury.gov', 'analyst@commerce.gov',
      'analyst@energy.gov', 'analyst@transportation.gov', 'analyst@epa.gov', 'analyst@nih.gov',
      'analyst@cdc.gov', 'analyst@noaa.gov', 'analyst@nasa.gov', 'analyst@usgs.gov',
      'analyst@uscourts.gov', 'analyst@congress.gov', 'analyst@gao.gov', 'analyst@ftc.gov',
      'analyst@sec.gov', 'analyst@irs.gov', 'analyst@fbi.gov', 'analyst@cia.gov',
      'analyst@atf.gov', 'analyst@dea.gov', 'analyst@usdoj.gov', 'analyst@us-cert.gov',
      'analyst.sec@govsec.mil', 'analyst.ops@govsec.mil', 'analyst.intel@govsec.mil',
      'analyst.osint@govsec.mil', 'analyst.cyber@govsec.mil', 'analyst.network@govsec.mil',
      'analyst.data@govsec.mil', 'analyst.research@govsec.mil', 'analyst.security@govsec.mil',
      'analyst.admin@govsec.mil', 'analyst.api@govsec.mil', 'analyst.support@govsec.mil'
    ];

    const { DAERService } = await import('./DAERService');
    await DAERService.seedRegistryIdentifiers(identifiers);
  }

  private static async seedBaselineTargets(userId: string) {
    const baselineTargets: Omit<Target, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Infrastructure Baseline',
        type: 'domain',
        status: 'active',
        confidenceScore: 95,
        createdBy: userId,
        userPersonaId: 'system',
        isPriorityAsset: true
      },
      {
        name: 'Seed Node Delta-9',
        type: 'ip',
        status: 'active',
        confidenceScore: 40,
        createdBy: userId,
        userPersonaId: 'system'
      }
    ];

    for (const target of baselineTargets) {
      await addDoc(collection(db, 'targets'), {
        ...target,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  private static async seedBaselinePersonas(userId: string) {
    const baselinePersona: Omit<AIPersona, 'id' | 'createdAt'> = {
      userId,
      name: 'Nexus Sentinel',
      personality: 'Methodical, precise, and highly analytical CTI coordinator.',
      knowledgeDomains: ['Network Defense', 'Attribution', 'Zero-Trust'],
      tone: 'technical',
      isDefault: true
    };

    await addDoc(collection(db, `users/${userId}/ai_personas`), {
      ...baselinePersona,
      createdAt: serverTimestamp()
    });
  }
}
