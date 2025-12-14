import React, { createContext, useContext, useState, useEffect } from "react";
import { useFolders } from "@/hooks/useFolders";
import { createDefaultFolder } from "@/db/draw";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

interface FolderContextType {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  folders: any[] | undefined;
  isLoading: boolean;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { folders, isLoading } = useFolders();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Ensure user has a default folder
  useEffect(() => {
    async function ensureDefaultFolder() {
      if (user?.id && folders && folders.length === 0 && !isLoading) {
        // User has no folders, create a default one
        try {
          await createDefaultFolder(user.id);
          // Invalidate folders query to refetch
          queryClient.invalidateQueries({ queryKey: ["folders"] });
        } catch (error) {
          console.error("Failed to create default folder:", error);
          // Optionally, import and use a toast notification here if needed
        }
      }
    }

    ensureDefaultFolder();
  }, [user?.id, folders, isLoading, queryClient]);

  // Set default selected folder when folders load
  useEffect(() => {
    if (folders && folders.length > 0 && !selectedFolderId) {
      // Prefer "My Drawings" folder if it exists, otherwise use the first folder
      const defaultFolder = folders.find(f => f.name === "My Drawings") || folders[0];
      setSelectedFolderId(defaultFolder.folder_id);
    }
  }, [folders, selectedFolderId]);

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
