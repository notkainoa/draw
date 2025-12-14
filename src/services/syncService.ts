import { offlineStore, PendingChange, PendingPageChange, PendingFolderChange, PendingPageCreate, PendingFolderCreate } from '@/stores/offlineStore';
import { setDrawData, renameFolder, createNewPage, createFolder } from '@/db/draw';
import { drawDataStore } from '@/stores/drawDataStore';
import { folderDataStore } from '@/stores/folderDataStore';
import { toast } from 'sonner';

export class SyncService {
  private static instance: SyncService;
  private isCurrentlySyncing = false;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncPendingChanges(): Promise<void> {
    if (this.isCurrentlySyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    const store = offlineStore.getState();
    const pendingChanges = store.pendingChanges;

    if (pendingChanges.length === 0) {
      console.log('No pending changes to sync');
      return;
    }

    this.isCurrentlySyncing = true;
    store.setSyncing(true);
    store.setLastSyncAttempt(new Date().toISOString());

    console.log(`Starting sync of ${pendingChanges.length} pending changes...`);

    let successCount = 0;
    let failureCount = 0;

    // Sort changes by timestamp to ensure proper order
    const sortedChanges = [...pendingChanges].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const change of sortedChanges) {
      try {
        await this.syncSingleChange(change);
        store.removePendingChange(change.id);
        successCount++;
        console.log(`Successfully synced change: ${change.type}`, change);
      } catch (error) {
        console.error(`Failed to sync change: ${change.type}`, change, error);
        failureCount++;
        
        // For critical errors, we might want to remove the change to prevent infinite retries
        if (error instanceof Error && error.message.includes('not found')) {
          console.log('Removing invalid change due to not found error');
          store.removePendingChange(change.id);
        }
      }
    }

    this.isCurrentlySyncing = false;
    store.setSyncing(false);

    // Show appropriate toast messages
    if (successCount > 0 && failureCount === 0) {
      toast.success(`Synced ${successCount} changes successfully`);
    } else if (successCount > 0 && failureCount > 0) {
      toast.warning(`Synced ${successCount} changes, ${failureCount} failed`);
    } else if (failureCount > 0) {
      toast.error(`Failed to sync ${failureCount} changes`);
    }

    console.log(`Sync completed: ${successCount} successful, ${failureCount} failed`);
  }

  private async syncSingleChange(change: PendingChange): Promise<void> {
    switch (change.type) {
      case 'page_update':
        await this.syncPageUpdate(change as PendingPageChange);
        break;
      case 'folder_rename':
        await this.syncFolderRename(change as PendingFolderChange);
        break;
      case 'page_create':
        await this.syncPageCreate(change as PendingPageCreate);
        break;
      case 'folder_create':
        await this.syncFolderCreate(change as PendingFolderCreate);
        break;
      default:
        console.warn('Unknown change type:', (change as any).type);
    }
  }

  private async syncPageUpdate(change: PendingPageChange): Promise<void> {
    const response = await setDrawData(change.page_id, change.elements, change.name);
    if (response.error) {
      throw new Error(`Failed to sync page update: ${response.error.message}`);
    }
    
    // Update local store with the successful sync
    drawDataStore.getState().setPageData(
      change.page_id, 
      change.elements, 
      new Date().toISOString(), 
      change.name
    );
  }

  private async syncFolderRename(change: PendingFolderChange): Promise<void> {
    const response = await renameFolder(change.folder_id, change.name);
    if (response.error) {
      throw new Error(`Failed to sync folder rename: ${response.error.message}`);
    }
    
    // Update local folder store
    const folderData = folderDataStore.getState().getFolderData(change.folder_id);
    if (folderData) {
      folderDataStore.getState().setFolderData(
        change.folder_id,
        change.name,
        new Date().toISOString(),
        folderData.user_id,
        folderData.created_at
      );
    }
  }

  private async syncPageCreate(change: PendingPageCreate): Promise<void> {
    const response = await createNewPage(change.elements, change.folder_id);
    if (response.error) {
      throw new Error(`Failed to sync page creation: ${response.error.message}`);
    }
    
    // The new page will have a different ID from Supabase
    // We should update our local references if needed
    console.log('Page created successfully:', response.data);
  }

  private async syncFolderCreate(change: PendingFolderCreate): Promise<void> {
    const response = await createFolder(change.name);
    if (response.error) {
      throw new Error(`Failed to sync folder creation: ${response.error.message}`);
    }
    
    // Update local folder store with the new folder data
    if (response.data && response.data[0]) {
      const newFolder = response.data[0];
      folderDataStore.getState().setFolderData(
        newFolder.folder_id,
        newFolder.name,
        newFolder.updated_at,
        newFolder.user_id,
        newFolder.created_at
      );
    }
    
    console.log('Folder created successfully:', response.data);
  }
}

export const syncService = SyncService.getInstance();
