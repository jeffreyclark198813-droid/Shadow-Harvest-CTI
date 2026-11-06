import { 
  db, collection, addDoc, serverTimestamp, query, where, onSnapshot
} from '../firebase';
import { FederatedSearchResult, AuthorityPolicy, AuthorizationStatus } from '../types/federated';
import { handleFirestoreError, OperationType } from '../firebase';
import { AuditService } from './AuditService';

export class FederatedSearchService {
  private static readonly resultsPath = 'federated_results';
  private static readonly policiesPath = 'authority_policies';

  /**
   * Orchestrates the Query pipeline defined in UI-OS Section 88.
   */
  public static async executeQuery(
    queryText: string,
    options: {
      providerIds?: string[];
      jurisdiction?: string;
    } = {}
  ) {
    const correlationId = crypto.randomUUID();
    
    await AuditService.logOperation(
      'SEARCH_REQUEST',
      `Initiating federated search: ${queryText}`,
      'success',
      undefined,
      { correlationId, options }
    );

    try {
      // 1. Resolve providers (Backend duty, but we'll proxy it)
      const response = await fetch('/api/v1/federated/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, correlationId, ...options })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Federated search failed');
      }

      const results = await response.json();
      
      await AuditService.logOperation(
        'SEARCH_RESPONSE',
        `Federated search completed with ${results.length} results`,
        'success',
        undefined,
        { correlationId, resultCount: results.length }
      );

      return results as FederatedSearchResult[];
    } catch (error: any) {
      await AuditService.logOperation(
        'PROVIDER_ERROR',
        `Search failure: ${error.message}`,
        'failure',
        undefined,
        { correlationId }
      );
      throw error;
    }
  }

  public static subscribeToResults(queryId: string, callback: (results: FederatedSearchResult[]) => void) {
    const q = query(collection(db, this.resultsPath), where('query_id', '==', queryId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FederatedSearchResult)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.resultsPath);
    });
  }

  // Authority & Governance (IAMLaw)
  public static subscribeToPolicies(callback: (policies: AuthorityPolicy[]) => void) {
    return onSnapshot(collection(db, this.policiesPath), (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuthorityPolicy)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.policiesPath);
    });
  }

  public static async createPolicy(policy: Omit<AuthorityPolicy, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, this.policiesPath), {
        ...policy,
        effective_from: serverTimestamp(),
        expires_at: policy.expires_at || serverTimestamp() // In real app, calculate offset
      });
      
      await AuditService.logOperation(
        'POLICY_CHANGE',
        `Created authorization policy for ${policy.principal}`,
        'success',
        docRef.id
      );
      
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, this.policiesPath);
    }
  }
}
