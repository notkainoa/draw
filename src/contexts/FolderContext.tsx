import React, { createContext, useContext, useState, useEffect } from "react";
import { useFolders } from "@/hooks/useFolders";
import { migrateDefaultFolderToRoot, type Folder } from "@/db/draw";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

interface FolderContextType {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  folders: Folder[] | undefined;
  isLoading: boolean;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { folders, isLoading } = useFolders();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Migrate "My Drawings" to root
  useEffect(() => {
    async function handleMigration() {
      if (user?.id && folders && !isLoading) {
        const defaultFolder = folders.find(f => f.name === "My Drawings");
        if (defaultFolder) {
          try {
            await migrateDefaultFolderToRoot(user.id);
            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["folders"] });
            queryClient.invalidateQueries({ queryKey: ["folderPages"] });
            queryClient.invalidateQueries({ queryKey: ["pages"] });
          } catch (error) {
            console.error("Failed to migrate default folder:", error);
          }
        }
      }
    }

    handleMigration();
  }, [user?.id, folders, isLoading, queryClient]);

  return (
    <FolderContext.Provider
      value={{
        selectedFolderId,
        setSelectedFolderId,
        folders,
        isLoading,
      }}
    >
      {children}
    </FolderContext.Provider>
  );
}

export function useFolderContext() {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error("useFolderContext must be used within a FolderProvider");
  }
  return context;
}
