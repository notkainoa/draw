import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types";

export type PendingPageChange = {
  id: string;
  page_id: string;
  elements: readonly NonDeletedExcalidrawElement[];
  name: string;
  timestamp: string;
  type: 'page_update';
  files?: BinaryFiles;
};

export type PendingFolderChange = {
  id: string;
  folder_id: string;
  name: string;
  timestamp: string;
  type: 'folder_rename';
};

export type PendingPageCreate = {
  id: string;
  elements?: readonly NonDeletedExcalidrawElement[];
  folder_id: string;
  name: string;
  timestamp: string;
  type: 'page_create';
  files?: BinaryFiles;
};

export type PendingFolderCreate = {
  id: string;
  name: string;
  timestamp: string;
  type: 'folder_create';
};

export type PendingChange = 
  | PendingPageChange 
  | PendingFolderChange 
  | PendingPageCreate 
  | PendingFolderCreate;

type OfflineStore = {
  pendingChanges: PendingChange[];
  isSyncing: boolean;
  lastSyncAttempt: string | null;
  addPendingChange: (change: Omit<PendingPageChange, 'id' | 'timestamp'> | Omit<PendingFolderChange, 'id' | 'timestamp'> | Omit<PendingPageCreate, 'id' | 'timestamp'> | Omit<PendingFolderCreate, 'id' | 'timestamp'>) => void;
  removePendingChange: (id: string) => void;
  clearPendingChanges: () => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAttempt: (timestamp: string) => void;
  getPendingChangesCount: () => number;
  hasPendingChanges: () => boolean;
};

const offlineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      pendingChanges: [],
      isSyncing: false,
      lastSyncAttempt: null,
      
      addPendingChange: (change) => {
        const id = `${change.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        set((state) => {
          // Remove any existing pending change for the same item to avoid duplicates
          const filteredChanges = state.pendingChanges.filter(existing => {
            if (change.type === 'page_update' && existing.type === 'page_update') {
              return (existing as PendingPageChange).page_id !== (change as PendingPageChange).page_id;
            }
            if (change.type === 'folder_rename' && existing.type === 'folder_rename') {
              return (existing as PendingFolderChange).folder_id !== (change as PendingFolderChange).folder_id;
            }
            return true;
          });

          return {
            pendingChanges: [...filteredChanges, { ...change, id, timestamp } as PendingChange],
          };
        });
      },
      
      removePendingChange: (id) =>
        set((state) => ({
          pendingChanges: state.pendingChanges.filter(change => change.id !== id),
        })),
      
      clearPendingChanges: () =>
        set({ pendingChanges: [] }),
      
      setSyncing: (syncing) =>
        set({ isSyncing: syncing }),
      
      setLastSyncAttempt: (timestamp) =>
        set({ lastSyncAttempt: timestamp }),
      
      getPendingChangesCount: () => get().pendingChanges.length,
      
      hasPendingChanges: () => get().pendingChanges.length > 0,
    }),
    {
      name: "offline-store",
    },
  ),
);

export { offlineStore };
