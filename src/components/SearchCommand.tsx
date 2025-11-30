import { useState, useEffect, useMemo } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { usePages } from "@/hooks/usePages";
import { useFolders } from "@/hooks/useFolders";
import { useFolderContext } from "@/contexts/FolderContext";
import { Search, FileText, Folder, Clock, Hash, User, FolderPlus, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createNewPage, createFolder } from "@/db/draw";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useProfileOverlay } from "@/contexts/ProfileOverlayContext";

dayjs.extend(relativeTime);

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  type: 'folder' | 'drawing' | 'action';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data?: any;
  action?: () => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const [search, setSearch] = useState("");
  const { pages } = usePages();
  const { folders } = useFolders();
  const { setSelectedFolderId, selectedFolderId } = useFolderContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openProfile } = useProfileOverlay();

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handlePageSelect = (pageId: string) => {
    onOpenChange(false);
    navigate({ to: "/page/$id", params: { id: pageId } });
  };

  const handleFolderSelect = (folderId: string) => {
    onOpenChange(false);
    setSelectedFolderId(folderId);
    navigate({ to: "/pages" });
  };

  // Action handlers
  const handleCreateNewPage = async () => {
    try {
      if (!user?.id) {
        toast.error("Please sign in to create a page");
        return;
      }

      const targetFolderId = selectedFolderId || folders?.[0]?.folder_id;
      if (!targetFolderId) {
        toast.error("No folder available");
        return;
      }

      const response = await createNewPage(undefined, targetFolderId);
      if (response.error) {
        toast.error("Failed to create page");
        return;
      }

      const newPageId = response.data?.[0]?.page_id;
      if (newPageId) {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["pages"] });
        queryClient.invalidateQueries({ queryKey: ["folderPages"] });
        navigate({ to: "/page/$id", params: { id: newPageId } });
        toast.success("New drawing created!");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
    }
  };

  const handleCreateNewFolder = async () => {
    try {
      if (!user?.id) {
        toast.error("Please sign in to create a folder");
        return;
      }

      const folderName = `New Folder ${(folders?.length || 0) + 1}`;
      const response = await createFolder(folderName);

      if (response.error) {
        toast.error("Failed to create folder");
        return;
      }

      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("New folder created!");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleOpenProfile = () => {
    onOpenChange(false);
    openProfile();
  };

  // Enhanced search results with better filtering and sorting
  const searchResults = useMemo(() => {
    const query = search.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Add action commands (always show these when there's a search or no search)
    const actionCommands: SearchResult[] = [
      {
        id: 'action-new-page',
        type: 'action',
        title: 'New Drawing',
        subtitle: 'Create a new drawing in the current folder',
        icon: <PlusCircle className="h-4 w-4 text-accent-blue" />,
        action: handleCreateNewPage,
      },
      {
        id: 'action-new-folder',
        type: 'action',
        title: 'New Folder',
        subtitle: 'Create a new folder to organize your drawings',
        icon: <FolderPlus className="h-4 w-4 text-accent-yellow" />,
        action: handleCreateNewFolder,
      },
      {
        id: 'action-profile',
        type: 'action',
        title: 'Profile',
        subtitle: 'View and edit your profile settings',
        icon: <User className="h-4 w-4 text-text-muted" />,
        action: handleOpenProfile,
      },
    ];

    // If no search query, show action commands
    if (!query) {
      return actionCommands;
    }

    // Filter action commands based on search
    actionCommands.forEach((command) => {
      if (
        command.title.toLowerCase().includes(query) ||
        command.subtitle.toLowerCase().includes(query) ||
        (command.title.toLowerCase().startsWith('new') && 'create'.includes(query)) ||
        (command.title === 'Profile' && ('settings'.includes(query) || 'account'.includes(query)))
      ) {
        results.push(command);
      }
    });

    if (!search.trim()) return results;

    // Search folders
    folders?.forEach((folder) => {
      if (folder.name.toLowerCase().includes(query)) {
        const pageCount = pages?.filter(p => p.folder_id === folder.folder_id).length || 0;
        results.push({
          id: `folder-${folder.folder_id}`,
          type: 'folder',
          title: folder.name,
          subtitle: `${pageCount} drawing${pageCount !== 1 ? 's' : ''}`,
          icon: <Folder className="h-4 w-4 text-accent-blue" />,
          data: folder,
        });
      }
    });

    // Search drawings/pages
    pages?.forEach((page) => {
      const pageName = page.name || "Untitled";
      if (pageName.toLowerCase().includes(query)) {
        const folderName = folders?.find(f => f.folder_id === page.folder_id)?.name || "Unknown";
        results.push({
          id: `drawing-${page.page_id}`,
          type: 'drawing',
          title: pageName,
          subtitle: `in ${folderName} • ${dayjs(page.updated_at).fromNow()}`,
          icon: <FileText className="h-4 w-4 text-text-muted" />,
          data: page,
        });
      }
    });

    // Sort results: folders first, then by relevance (exact matches first)
    return results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      const aExact = a.title.toLowerCase() === query;
      const bExact = b.title.toLowerCase() === query;
      if (aExact !== bExact) {
        return aExact ? -1 : 1;
      }

      const aStarts = a.title.toLowerCase().startsWith(query);
      const bStarts = b.title.toLowerCase().startsWith(query);
      if (aStarts !== bStarts) {
        return aStarts ? -1 : 1;
      }

      return a.title.localeCompare(b.title);
    });
  }, [search, folders, pages]);

  const handleResultSelect = (result: SearchResult) => {
    if (result.type === 'action' && result.action) {
      result.action();
    } else if (result.type === 'folder') {
      handleFolderSelect(result.data.folder_id);
    } else if (result.type === 'drawing') {
      handlePageSelect(result.data.page_id);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="rounded-modal border-2 border-border-subtle bg-background-card overflow-hidden font-virgil"
          style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)' }}
          shouldFilter={false}
        >
          <div className="flex items-center border-b-2 border-border-subtle px-4 py-3">
            <Search className="mr-3 h-5 w-5 shrink-0 text-text-muted" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search folders and drawings..."
              className="flex h-8 w-full bg-transparent text-base outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50 text-text-primary font-virgil"
              autoFocus
            />
            {search && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Hash className="h-3 w-3" />
                {searchResults.length}
              </div>
            )}
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {searchResults.length === 0 && search.trim() ? (
              <Command.Empty className="py-8 text-center">
                <div className="text-sm text-text-muted">
                  No results found for "{search}"
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Try a different search term
                </div>
              </Command.Empty>
            ) : (
              <div className="p-2">
                {searchResults.map((result, index) => (
                  <Command.Item
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleResultSelect(result)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-md px-3 py-3 text-sm outline-none transition-all duration-150 border-2 border-transparent",
                      "hover:bg-background-hover hover:border-text-muted",
                      "data-[selected]:bg-background-hover data-[selected]:border-text-muted",
                      index > 0 && "mt-1"
                    )}
                  >
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-background-main border-2 border-border-subtle">
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-text-muted truncate flex items-center gap-1">
                        {result.type === 'drawing' && <Clock className="h-3 w-3" />}
                        {result.subtitle}
                      </div>
                    </div>
                    <div className={cn(
                      "ml-2 text-xs px-2 py-1 rounded capitalize border-2",
                      result.type === 'action'
                        ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
                        : "bg-background-main text-text-muted border-border-subtle"
                    )}>
                      {result.type === 'drawing' ? 'drawing' : result.type}
                    </div>
                  </Command.Item>
                ))}
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
