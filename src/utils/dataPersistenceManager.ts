import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp,
  getDoc,
  DocumentReference,
  WriteBatch,
  Firestore,
  Transaction,
  runTransaction
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  DailyAssessment, 
  MoodEntry, 
  RelationshipContext,
  AssessmentData
} from '../types';

interface PendingOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: any;
}

export class DataPersistenceManager {
  private db: Firestore;
  private pendingOperations: PendingOperation[] = [];
  private batch: WriteBatch | null = null;

  constructor(db: Firestore) {
    this.db = db;
  }

  private initBatch() {
    if (!this.batch) {
      this.batch = writeBatch(this.db);
    }
    return this.batch;
  }

  private async addToBatch(operation: PendingOperation) {
    const batch = this.initBatch();
    let docRef: DocumentReference;

    switch (operation.type) {
      case 'create':
        docRef = doc(collection(this.db, operation.collection));
        batch.set(docRef, {
          ...operation.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        break;

      case 'update':
        if (!operation.docId) throw new Error('Document ID required for update');
        docRef = doc(this.db, operation.collection, operation.docId);
        batch.update(docRef, {
          ...operation.data,
          updatedAt: serverTimestamp()
        });
        break;

      case 'delete':
        if (!operation.docId) throw new Error('Document ID required for delete');
        docRef = doc(this.db, operation.collection, operation.docId);
        batch.delete(docRef);
        break;
    }

    this.pendingOperations.push(operation);
  }

  public async saveAssessmentWithRelatedData(
    assessment: DailyAssessment,
    moodEntry: MoodEntry,
    contextUpdate?: Partial<RelationshipContext>
  ) {
    try {
      // Add assessment
      await this.addToBatch({
        type: 'create',
        collection: 'assessments',
        data: assessment
      });

      // Add mood entry
      await this.addToBatch({
        type: 'create',
        collection: 'moodEntries',
        data: moodEntry
      });

      // Update user's latest assessment reference
      await this.addToBatch({
        type: 'update',
        collection: 'users',
        docId: assessment.userId,
        data: {
          lastAssessment: {
            id: assessment.id,
            date: assessment.date,
            type: 'daily_assessment'
          }
        }
      });

      // Update relationship context if provided
      if (contextUpdate) {
        await this.addToBatch({
          type: 'update',
          collection: 'relationshipContexts',
          docId: assessment.userId,
          data: contextUpdate
        });
      }

      // Commit all changes
      await this.commitBatch();

    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  private async commitBatch() {
    if (!this.batch) return;

    try {
      await this.batch.commit();
      this.clearBatch();
    } catch (error) {
      console.error('Error committing batch:', error);
      await this.rollback();
      throw error;
    }
  }

  private async rollback() {
    try {
      // Log failed operations for recovery
      await this.logFailedOperations();
      
      // Clear current batch
      this.clearBatch();
      
      // Attempt to revert any successful operations
      await this.revertSuccessfulOperations();
    } catch (error) {
      console.error('Error during rollback:', error);
      throw error;
    }
  }

  private clearBatch() {
    this.batch = null;
    this.pendingOperations = [];
  }

  private async logFailedOperations() {
    try {
      const failedOpsRef = doc(collection(this.db, 'failedOperations'));
      await runTransaction(this.db, async (transaction: Transaction) => {
        transaction.set(failedOpsRef, {
          operations: this.pendingOperations,
          timestamp: new Date().toISOString(),
          status: 'pending'
        });
      });
    } catch (error) {
      console.error('Error logging failed operations:', error);
    }
  }

  private async revertSuccessfulOperations() {
    const revertBatch = writeBatch(this.db);

    for (const operation of this.pendingOperations) {
      if (operation.type === 'create' && operation.docId) {
        // Delete created documents
        const docRef = doc(this.db, operation.collection, operation.docId);
        revertBatch.delete(docRef);
      } else if (operation.type === 'update' && operation.docId) {
        // Restore previous state for updated documents
        const docRef = doc(this.db, operation.collection, operation.docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const previousData = snapshot.data();
          revertBatch.set(docRef, previousData);
        }
      }
    }

    try {
      await revertBatch.commit();
    } catch (error) {
      console.error('Error reverting operations:', error);
      // At this point, manual intervention may be needed
      throw new Error('Critical error: Failed to revert operations');
    }
  }
}

export const dataPersistenceManager = new DataPersistenceManager(db); 