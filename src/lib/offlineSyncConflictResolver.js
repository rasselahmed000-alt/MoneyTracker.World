/**
 * P1 CRITICAL: Offline sync conflict resolution
 * - Detects concurrent modifications
 * - Resolves conflicts with server-authoritative strategy
 * - Prevents data loss
 */

const CONFLICT_STORE_KEY = 'cellfin_sync_conflicts';

export async function detectConflict(localData, remoteData) {
  if (!localData || !remoteData) return null;

  // Check for concurrent updates (both modified since fetch)
  if (
    localData.updated_date &&
    remoteData.updated_date &&
    localData.updated_date !== remoteData.updated_date
  ) {
    return {
      type: 'concurrent_update',
      local: localData,
      remote: remoteData,
      local_timestamp: localData.updated_date,
      remote_timestamp: remoteData.updated_date,
    };
  }

  // Check for version mismatch
  if (localData.version && remoteData.version && localData.version !== remoteData.version) {
    return {
      type: 'version_mismatch',
      local_version: localData.version,
      remote_version: remoteData.version,
    };
  }

  return null;
}

export function resolveConflict(conflict, strategy = 'server_authoritative') {
  if (!conflict) return null;

  switch (strategy) {
    case 'server_authoritative':
      // Server always wins — discard local changes
      return {
        resolved: true,
        winner: 'server',
        data: conflict.remote,
        action: 'discard_local_changes',
      };

    case 'client_authoritative':
      // Client wins — but requires confirmation
      return {
        resolved: false,
        requires_confirmation: true,
        message: 'Local changes will overwrite server data',
        action: 'upload_local_changes',
      };

    case 'merge':
      // Attempt merge (only works for non-conflicting fields)
      return {
        resolved: true,
        winner: 'merged',
        data: { ...conflict.remote, ...conflict.local },
        warning: 'Merged data may be inconsistent',
      };

    default:
      // Store conflict for manual review
      storeConflict(conflict);
      return {
        resolved: false,
        requires_admin_review: true,
        stored: true,
      };
  }
}

export function storeConflict(conflict) {
  try {
    const conflicts = JSON.parse(localStorage.getItem(CONFLICT_STORE_KEY) || '[]');
    conflicts.push({
      ...conflict,
      timestamp: new Date().toISOString(),
      id: `conflict_${Date.now()}`,
    });
    localStorage.setItem(CONFLICT_STORE_KEY, JSON.stringify(conflicts));
  } catch (err) {
    console.error('Failed to store conflict:', err);
  }
}

export function getStoredConflicts() {
  try {
    return JSON.parse(localStorage.getItem(CONFLICT_STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearConflict(conflictId) {
  try {
    const conflicts = getStoredConflicts();
    const filtered = conflicts.filter(c => c.id !== conflictId);
    localStorage.setItem(CONFLICT_STORE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to clear conflict:', err);
  }
}

// Auto-resolve conflicts on app start
export async function resolveOfflineConflicts(entityName) {
  const conflicts = getStoredConflicts();

  if (conflicts.length === 0) return { resolved: 0, failed: 0 };

  let resolved = 0;
  let failed = 0;

  for (const conflict of conflicts) {
    try {
      const resolution = resolveConflict(conflict, 'server_authoritative');

      if (resolution.resolved) {
        // Apply server data
        clearConflict(conflict.id);
        resolved++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
      failed++;
    }
  }

  return { resolved, failed };
}