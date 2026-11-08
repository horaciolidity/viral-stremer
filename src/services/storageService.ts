import { VideoRecording } from '../types/studio';

const DB_NAME = 'visioncast_recordings_db';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';
const BLOB_STORE_NAME = 'recording_blobs';

export class StorageService {
  private static instance: StorageService;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(BLOB_STORE_NAME)) {
          db.createObjectStore(BLOB_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  public async saveRecording(recording: VideoRecording, blob: Blob): Promise<string> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, BLOB_STORE_NAME], 'readwrite');
      const recStore = tx.objectStore(STORE_NAME);
      const blobStore = tx.objectStore(BLOB_STORE_NAME);

      // Save metadata without blob reference (blob URL will be created on load)
      const meta = { ...recording };
      delete meta.blobUrl;

      recStore.put(meta);
      blobStore.put({ id: recording.id, blob });

      tx.oncomplete = () => resolve(recording.id);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getRecordings(): Promise<VideoRecording[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as VideoRecording[];
        // Sort descending by date
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async getRecordingBlob(id: string): Promise<Blob | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE_NAME, 'readonly');
      const store = tx.objectStore(BLOB_STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob as Blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async deleteRecording(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, BLOB_STORE_NAME], 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.objectStore(BLOB_STORE_NAME).delete(id);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async updateRecording(id: string, updates: Partial<VideoRecording>): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, ...updates };
          store.put(updated);
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getStorageQuota(): Promise<{
    usedBytes: number;
    quotaBytes: number;
    percentage: number;
  }> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 1024 * 1024 * 1024 * 10; // fallback 10GB
        return {
          usedBytes: used,
          quotaBytes: total,
          percentage: Math.min(100, Math.round((used / total) * 100)),
        };
      } catch (err) {
        console.warn('Storage estimate error:', err);
      }
    }
    return { usedBytes: 0, quotaBytes: 10 * 1024 * 1024 * 1024, percentage: 0 };
  }
}
