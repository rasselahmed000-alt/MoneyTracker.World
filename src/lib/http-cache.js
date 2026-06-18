/**
 * IndexedDB-based HTTP Response Cache
 * Persists API responses for offline support & faster loads
 */

const DB_NAME = 'cellfin_cache';
const STORE_NAME = 'responses';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export async function getCachedResponse(url) {
  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      
      req.onsuccess = () => {
        const entry = req.result;
        if (entry && Date.now() - entry.timestamp < 10 * 60 * 1000) {
          resolve(entry.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedResponse(url, data) {
  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ url, data, timestamp: Date.now() });
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // IndexedDB not available, fail silently
  }
}

export async function clearOldCache() {
  try {
    const database = await openDB();
    const tx = database.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    
    // Delete entries older than 10 minutes
    const range = IDBKeyRange.upperBound(tenMinutesAgo);
    index.openCursor(range).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch {
    // Fail silently
  }
}

// Auto-cleanup old cache every 5 minutes
setInterval(() => clearOldCache(), 5 * 60 * 1000);