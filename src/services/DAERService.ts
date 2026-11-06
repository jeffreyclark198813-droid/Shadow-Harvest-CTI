import { 
  db, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, doc, getDocs, serverTimestamp, setDoc
} from '../firebase';
import { ApiEndpointConfig, RegistryIdentifier } from '../types/federated';
import { handleFirestoreError, OperationType } from '../firebase';

export class DAERService {
  private static readonly collectionPath = 'api_endpoints';

  public static async registerEndpoint(config: Omit<ApiEndpointConfig, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, this.collectionPath), {
        ...config,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, this.collectionPath);
    }
  }

  public static async updateEndpoint(id: string, updates: Partial<ApiEndpointConfig>) {
    try {
      await updateDoc(doc(db, this.collectionPath, id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.collectionPath);
    }
  }

  public static subscribeToEndpoints(callback: (endpoints: ApiEndpointConfig[]) => void) {
    const q = query(collection(db, this.collectionPath));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ApiEndpointConfig)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionPath);
    });
  }

  public static async getActiveEndpoints(): Promise<ApiEndpointConfig[]> {
    const q = query(collection(db, this.collectionPath), where('enabled', '==', true), where('status', '==', 'ACTIVE'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ApiEndpointConfig));
  }

  // Identifier Registry (Unverified Identifiers)
  public static async seedRegistryIdentifiers(identifiers: string[]) {
    const registryPath = 'registry_identifiers';
    for (const identifier of identifiers) {
      const id = identifier.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, registryPath, id), {
        identifier,
        classification: 'UNVERIFIED_CONFIGURATION_IDENTIFIERS',
        state: 'IDENTITY_UNVERIFIED',
        metadata: {
          seededAt: new Date().toISOString()
        }
      }, { merge: true });
    }
  }

  public static subscribeToRegistry(callback: (identifiers: RegistryIdentifier[]) => void) {
    const registryPath = 'registry_identifiers';
    return onSnapshot(collection(db, registryPath), (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RegistryIdentifier)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, registryPath);
    });
  }
}
