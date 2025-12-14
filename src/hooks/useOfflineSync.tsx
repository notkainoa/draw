import { useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineStore } from '@/stores/offlineStore';
import { syncService } from '@/services/syncService';
import { useAuth } from './useAuth';

export function useOfflineSync() {
  const { isOnline, justCameOnline } = useNetworkStatus();
  const { isAuthenticated } = useAuth();
  const {
    isSyncing,
    hasPendingChanges,
    getPendingChangesCount
  } = offlineStore();

  // Sync when coming back online
  useEffect(() => {
    if (justCameOnline && isAuthenticated && hasPendingChanges()) {
      console.log('Device came back online, starting sync...');
      syncService.syncPendingChanges();
    }
  }, [justCameOnline, isAuthenticated, hasPendingChanges]);

  // Periodic sync when online (every 5 minutes)
  useEffect(() => {
    if (!isOnline || !isAuthenticated) return;

    const syncInterval = setInterval(() => {
      if (hasPendingChanges() && !isSyncing) {
        console.log('Periodic sync check - syncing pending changes...');
        syncService.syncPendingChanges();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [isOnline, isAuthenticated, hasPendingChanges, isSyncing]);

  // Manual sync function
  const manualSync = async () => {
    if (isOnline && isAuthenticated && hasPendingChanges()) {
      await syncService.syncPendingChanges();
    }
  };

  return {
    isOnline,
    isSyncing,
    pendingChangesCount: getPendingChangesCount(),
    hasPendingChanges: hasPendingChanges(),
    manualSync,
  };
}
