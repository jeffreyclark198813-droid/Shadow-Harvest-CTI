import { db, collection, addDoc, serverTimestamp, auth } from '../firebase';
import { AuditLogEntry } from '../types/intelligence_ops';
import { defaultAnonymizationEngine } from './anonymizationService';

export class AuditService {
  private static readonly collectionPath = 'audit_logs';

  /**
   * Captures security-sensitive operations with automatic redaction of sensitive details.
   * Implements UIF-OS Section 32.
   */
  public static async logOperation(
    action: string,
    details: string,
    result: 'success' | 'failure',
    targetId?: string,
    metadata?: any
  ): Promise<string | undefined> {
    const user = auth.currentUser;
    if (!user) return;

    // Redact sensitive information from details
    const anonymized = defaultAnonymizationEngine.anonymizeText(details);
    const redactedDetails = anonymized.redactedText;

    const logData: any = {
      userId: user.uid,
      action,
      details: redactedDetails,
      result,
      timestamp: serverTimestamp()
    };

    // Strip undefined from metadata
    if (metadata) {
      const cleanMetadata: any = {};
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined) {
          cleanMetadata[key] = metadata[key];
        }
      });
      logData.metadata = {
        ...cleanMetadata,
        redactionCount: anonymized.redactionCount,
        originalLength: details.length,
        clientTimestamp: Date.now()
      };
    } else {
      logData.metadata = {
        redactionCount: anonymized.redactionCount,
        originalLength: details.length,
        clientTimestamp: Date.now()
      };
    }

    if (targetId !== undefined && targetId !== null && targetId !== 'undefined') {
      logData.targetId = targetId;
    }

    // Absolutely sanitize all properties of logData to prevent Firestore Unsupported field value errors
    const finalLogData: any = {};
    Object.keys(logData).forEach(key => {
      const val = logData[key];
      if (val !== undefined && val !== null && val !== 'undefined') {
        if (key === 'metadata' && val && typeof val === 'object') {
          const cleanMetadata: any = {};
          Object.keys(val).forEach(k => {
            const mVal = val[k];
            if (mVal !== undefined && mVal !== null && mVal !== 'undefined') {
              cleanMetadata[k] = mVal;
            }
          });
          finalLogData[key] = cleanMetadata;
        } else {
          finalLogData[key] = val;
        }
      }
    });

    try {
      const docRef = await addDoc(collection(db, this.collectionPath), finalLogData);
      return docRef.id;
    } catch (error) {
      console.error('[AuditService] Failed to log operation:', error);
      return undefined;
    }
  }

  /**
   * Helper for logging sensitive access attempts
   */
  public static async logAccess(targetId: string, result: 'success' | 'failure', details?: string) {
    return this.logOperation(
      'DATA_ACCESS',
      details || `Accessed target ${targetId}`,
      result,
      targetId
    );
  }

  /**
   * Helper for logging system configuration changes
   */
  public static async logConfigChange(action: string, oldVal: any, newVal: any) {
    const details = `Changed configuration: ${action} from ${JSON.stringify(oldVal)} to ${JSON.stringify(newVal)}`;
    return this.logOperation('CONFIG_CHANGE', details, 'success');
  }
}
