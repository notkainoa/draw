import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFolders, getPagesByFolder, Folder, getPages } from "@/db/draw";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { supabase } from "@/db/supabase";

export function useFolders() {
  const { user } = useAuth();

  const {
    data: folders,
    isLoading,
    error,
    refetch: refetchFolders,
  } = useQuery({
    queryKey: ["folders", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      const response = await getFolders(user.id);
      return response.data || [];
    },
    enabled: !!user?.id,
  });

  return {
    folders: folders as Folder[] | undefined,
    isLoading,
    error,
    refetchFolders,
  };
}

export function useFolderPages(folderId: string | null) {
  const { user } = useAuth();

  const {
    data: pages,
    isLoading,
    error,
    refetch: refetchPages,
  } = useQuery({
    queryKey: ["folderPages", user?.id, folderId],
    queryFn: async () => {
      if (!user?.id || !folderId) return [];
      const response = await getPagesByFolder(user.id, folderId);
      return response.data || [];
    },
    enabled: !!user?.id && !!folderId,
  });

  return {
    pages,
    isLoading,
    error,
    refetchPages,
  };
}

export function useFolderPageCounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: pageCounts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["folderPageCounts", user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const response = await getPages(user.id);
      const pages = response.data || [];

      // Count pages per folder
      const counts: Record<string, number> = {};
      pages.forEach((page: any) => {
        if (page.folder_id) {
          counts[page.folder_id] = (counts[page.folder_id] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("folder-page-counts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draw" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["folderPageCounts", user?.id],
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    pageCounts: pageCounts || {},
    isLoading,
    error,
  };
}
