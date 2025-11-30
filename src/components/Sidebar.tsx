import { usePages, PageData } from "@/hooks/usePages";
import { useFolderPages, useFolderPageCounts } from "@/hooks/useFolders";
import { useFolderContext } from "@/contexts/FolderContext";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  User,
  Folder,
  Edit,
  Trash2,
  ChevronLeft,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchCommand } from "./SearchCommand";
import { useState } from "react";
import { createNewPage, createFolder, deleteFolder, updateFolder } from "@/db/draw";

import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useProfileOverlay } from "@/contexts/ProfileOverlayContext";

// Temporary: Simple fallback for icon rendering
const renderIcon = (iconValue: string | undefined) => {
  return iconValue || "📁";
};

interface SidebarProps {
  className?: string;
}

interface SidebarItemProps {
  page: PageData;
  isActive: boolean;
}



function UserProfileFooter() {
  const { user, loading } = useAuth();
  const { openProfile } = useProfileOverlay();

  // Extract user information with proper fallbacks
  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || "User";
  const userEmail = user?.email || "user@example.com";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  if (loading) {
    return (
      <div className="mx-4 mb-4">
        <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md bg-background-card border border-border-subtle min-w-0">
          <div className="w-8 h-8 rounded-full bg-background-hover animate-pulse flex-shrink-0" />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="h-3 bg-background-hover rounded animate-pulse w-20" />
            <div className="h-2 bg-background-hover rounded animate-pulse w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={openProfile}
        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-md transition-all duration-200 ease-in-out cursor-pointer text-text-secondary hover:bg-background-hover hover:text-text-primary bg-background-card border border-border-subtle min-w-0"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent-blue to-purple-600 text-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="font-medium truncate w-full text-left text-text-primary">
            {userName}
          </span>
          <span className="text-xs text-text-muted truncate w-full text-left">
            {userEmail}
          </span>
        </div>
      </button>
    </div>
  );
}

function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mx-4">
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full px-3 py-3 text-sm rounded-md transition-all duration-200 ease-in-out cursor-pointer text-text-muted hover:bg-background-hover hover:text-text-primary bg-background-card border border-border-subtle group"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Search className="h-4 w-4 flex-shrink-0 group-hover:text-accent-blue transition-colors" />
          <span className="font-normal truncate">Search & commands</span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
          <kbd className="px-1.5 py-0.5 text-xs bg-background-main rounded text-text-muted border border-border-subtle font-mono">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-xs bg-background-main rounded text-text-muted border border-border-subtle font-mono">K</kbd>
        </div>
      </button>
    </div>
  );
}



function HomeButton({
  isSelected,
  onClick
}: {
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mx-4 mb-4">
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out cursor-pointer text-text-secondary hover:bg-background-hover hover:text-text-primary",
          isSelected && "bg-accent-blue/10 text-text-primary border border-accent-blue/20"
        )}
      >
        <Home className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium truncate">Home</span>
      </button>
    </div>
  );
}

function FoldersSection({
  children,
  onCreateFolder
}: {
  children: React.ReactNode;
  onCreateFolder: () => void;
}) {
  return (
    <div className="mx-4">
      <div className="flex items-center justify-between px-3 py-2 mb-2 min-w-0">
        <div className="flex items-center gap-2 text-text-primary min-w-0 flex-1">
          <Folder className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium text-sm truncate">Folders</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <Button
            size="sm"
            variant="default"
            className="h-6 w-6 p-0 bg-accent-blue hover:bg-blue-600 flex-shrink-0"
            onClick={onCreateFolder}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function FolderPagesSection({
  folderName,
  folderIcon,
  children,
  onCreatePage,
  onBackToDashboard
}: {
  folderName: string;
  folderIcon?: string;
  children: React.ReactNode;
  onCreatePage: () => void;
  onBackToDashboard: () => void;
}) {
  return (
    <div className="mx-4">
      <div className="flex items-center justify-between px-3 py-2 mb-2 min-w-0">
        <button
          className="flex items-center gap-2 min-w-0 flex-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          onClick={onBackToDashboard}
        >
          <ChevronLeft className="h-4 w-4 flex-shrink-0" />
          <span className="text-base flex-shrink-0">{renderIcon(folderIcon)}</span>
          <span className="font-medium text-sm truncate">{folderName}</span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <Button
            size="sm"
            variant="default"
            className="h-6 w-6 p-0 bg-accent-blue hover:bg-blue-600 flex-shrink-0"
            onClick={onCreatePage}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function FolderItem({
  folder,
  pageCount,
  isSelected,
  onSelect,
  onRename,
  onCreateDrawing,
  onDelete
}: {
  folder: any;
  pageCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (folderId: string, newName: string) => void;
  onCreateDrawing: (folderId: string) => void;
  onDelete: (folderId: string) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRename(folder.folder_id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(folder.name);
      setIsRenaming(false);
    }
  };

  if (isRenaming) {
    return (
      <div className="px-3 py-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyPress}
          className="w-full px-2 py-1 text-sm bg-background-input border border-border-input rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out cursor-pointer w-full text-left min-w-0",
        isSelected
          ? "bg-accent-blue/10 text-text-primary border border-accent-blue/20"
          : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
      )}
    >
      {/* Folder Icon */}
      <span className="text-base flex-shrink-0">{renderIcon(folder.icon)}</span>

      {/* Folder Name */}
      <div className="flex-1 min-w-0">
        <span className="truncate font-medium text-sm">
          {folder.name}
        </span>
      </div>

      {/* Drawing Count / Actions Toggle */}
      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0 relative">
        {/* Drawing Count - visible by default, hidden on hover */}
        <span className="text-xs text-text-muted group-hover:opacity-0 transition-opacity absolute">
          {pageCount}
        </span>

        {/* Actions - hidden by default, visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateDrawing(folder.folder_id);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Drawing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder.folder_id);
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </button>
  );
}



function PageItem({ page, isActive }: SidebarItemProps) {
  const { user } = useAuth();

  // Generate a random color for the thumbnail
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-red-500'];
  const colorIndex = page.page_id.charCodeAt(0) % colors.length;
  const thumbnailColor = colors[colorIndex];

  // Get user avatar info
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || "User";

  return (
    <Link
      to="/page/$id"
      params={{ id: page.page_id }}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all duration-200 ease-in-out cursor-pointer w-full min-w-0",
        isActive
          ? "bg-accent-blue/10 text-text-primary border border-accent-blue/20"
          : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
      )}
    >
      {/* Thumbnail */}
      <div className={cn("w-7 h-7 rounded flex-shrink-0 flex items-center justify-center", thumbnailColor)}>
        <FileText className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="truncate font-medium text-sm leading-tight">
          {page.name || "Untitled"}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {/* User Avatar */}
          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent-blue to-purple-600 text-white">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-2.5 w-2.5" />
            )}
          </div>
          <span className="text-xs text-text-muted truncate">
            {dayjs(page.updated_at).fromNow()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </Link>
  );
}

function EmptyPagesState() {
  return (
    <div className="px-3 py-2">
      <div className="text-xs text-text-muted">
        No pages yet
      </div>
    </div>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);

  // Get folder context data
  const { selectedFolderId, setSelectedFolderId, folders, isLoading: foldersLoading } = useFolderContext();
  const { pages: allPages } = usePages(); // For search functionality
  const { pageCounts } = useFolderPageCounts();



  // Extract page ID from current location pathname
  const currentPageId = location.pathname.startsWith('/page/')
    ? location.pathname.split('/page/')[1]
    : null;

  // Get current page data to determine its folder
  const currentPage = allPages?.find(page => page.page_id === currentPageId);
  const currentFolder = folders?.find(folder => folder.folder_id === currentPage?.folder_id);

  // Get pages for current folder when viewing individual page
  const { pages: folderPages, isLoading: folderPagesLoading } = useFolderPages(
    currentPage?.folder_id || null
  );

  // Determine if we're on pages view or individual page view
  const isOnPagesView = location.pathname === "/pages";
  const isOnIndividualPage = location.pathname.startsWith('/page/');

  // Handle folder creation
  async function handleCreateFolder() {
    const data = await createFolder("New Folder");
    if (data.data && data.data[0]?.folder_id) {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
      await queryClient.invalidateQueries({ queryKey: ["folderPages"] });

      // Always set the new folder as selected
      setSelectedFolderId(data.data[0].folder_id);

      if (!isOnPagesView) {
        navigate({ to: "/pages" });
      }
      toast("Successfully created a new folder!");
    }
    if (data.error) {
      toast("An error occurred", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  // Handle page creation in current folder
  async function handleCreatePageInFolder() {
    if (!currentPage?.folder_id) return;

    const data = await createNewPage(undefined, currentPage.folder_id);
    if (data.data && data.data[0]?.page_id) {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["folderPages"] });
      navigate({ to: "/page/$id", params: { id: data.data[0].page_id } });
      toast("Successfully created a new page!");
    }
    if (data.error) {
      toast("An error occurred", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  // Handle folder rename
  async function handleRenameFolder(folderId: string, newName: string) {
    const data = await updateFolder(folderId, { name: newName });
    if (data.data) {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast("Successfully renamed folder!");
    }
    if (data.error) {
      toast("An error occurred", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  // Handle creating drawing in specific folder
  async function handleCreateDrawingInFolder(folderId: string) {
    const data = await createNewPage(undefined, folderId);
    if (data.data && data.data[0]?.page_id) {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["folderPages"] });
      queryClient.invalidateQueries({ queryKey: ["folderPageCounts"] });
      navigate({ to: "/page/$id", params: { id: data.data[0].page_id } });
      toast("Successfully created a new drawing!");
    }
    if (data.error) {
      toast("An error occurred", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  // Handle back to dashboard navigation with folder selected
  function handleBackToDashboard() {
    if (currentFolder) {
      setSelectedFolderId(currentFolder.folder_id);
    } else {
      setSelectedFolderId(null); // Back to Home
    }
    navigate({ to: "/pages" });
  }

  // Handle folder deletion
  async function handleDeleteFolder(folderId: string) {
    // Find the folder being deleted
    // const folderToDelete = folders?.find(f => f.folder_id === folderId);

    // Show confirmation dialog
    const pageCount = pageCounts[folderId] || 0;
    const confirmMessage = pageCount > 0
      ? `Are you sure you want to delete this folder? All ${pageCount} drawing(s) in this folder will be moved to your Home workspace.`
      : "Are you sure you want to delete this folder?";

    if (!confirm(confirmMessage)) {
      return;
    }

    const data = await deleteFolder(folderId);
    if (data.error === null) {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["folderPages"] });
      queryClient.invalidateQueries({ queryKey: ["folderPageCounts"] });

      // If the deleted folder was selected, go to Home
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }

      toast("Successfully deleted folder!");
    }
    if (data.error) {
      toast("An error occurred", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  return (
    <div
      className={cn(
        "flex h-full w-72 flex-col bg-background-main border-r border-border-subtle min-w-0 overflow-hidden",
        className
      )}
    >
      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 min-w-0">
        {/* Search Section */}
        <div className="mb-4 min-w-0">
          <SearchButton onClick={() => setSearchOpen(true)} />
        </div>





        {/* Conditional Content Based on Route */}
        {isOnPagesView ? (
          <>
            <HomeButton
              isSelected={selectedFolderId === null}
              onClick={() => setSelectedFolderId(null)}
            />

            {/* Folders Section for Pages View - Show folders only, no individual pages */}
            <FoldersSection
              onCreateFolder={handleCreateFolder}
            >
              {foldersLoading ? (
                <div className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />
                    <span className="text-xs text-text-muted">Loading...</span>
                  </div>
                </div>
              ) : folders && folders.length > 0 ? (
                folders.map((folder) => (
                  <FolderItem
                    key={folder.folder_id}
                    folder={folder}
                    pageCount={pageCounts[folder.folder_id] || 0}
                    isSelected={selectedFolderId === folder.folder_id}
                    onSelect={() => setSelectedFolderId(folder.folder_id)}
                    onRename={handleRenameFolder}
                    onCreateDrawing={handleCreateDrawingInFolder}
                    onDelete={handleDeleteFolder}
                  />
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-text-muted">No folders</div>
              )}
            </FoldersSection>
          </>
        ) : isOnIndividualPage ? (
          /* Folder Pages Section for Individual Page View - Show pages in current folder */
          <FolderPagesSection
            folderName={currentFolder?.name ?? "Unknown Folder"}
            folderIcon={currentFolder?.icon}
            onCreatePage={handleCreatePageInFolder}
            onBackToDashboard={handleBackToDashboard}
          >
            {folderPagesLoading ? (
              <div className="px-3 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />
                  <span className="text-xs text-text-muted">Loading...</span>
                </div>
              </div>
            ) : folderPages && folderPages.length > 0 ? (
              folderPages.map((page) => (
                <PageItem
                  key={page.page_id}
                  page={page}
                  isActive={currentPageId === page.page_id}
                />
              ))
            ) : (
              <EmptyPagesState />
            )}
          </FolderPagesSection>
        ) : null}
      </div>

      {/* User Profile Footer */}
      <UserProfileFooter />

      {/* Search Command Palette */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
