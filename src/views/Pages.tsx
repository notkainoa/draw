import { useQueryClient } from "@tanstack/react-query";
import { createNewPage, deletePage, updateFolder } from "../db/draw";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Loader from "@/components/Loader";
import NoData from "./NoData";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "@tanstack/react-router";
import { useFolderPages } from "@/hooks/useFolders";
import { useFolderContext } from "@/contexts/FolderContext";
import { 
  Trash2,
  Folder,
  FolderOpen,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Upload,
  Settings,
  User,
  Users,
  Heart,
  Star,
  Home,
  Building,
  Camera,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Wifi,
  Battery,
  Zap,
  Sun,
  Coffee,
  Gift,
  ShoppingCart,
  CreditCard,
  Bookmark,
  Tag,
  Flag,
  Bell,
  Lock,
  Key,
  Shield,
  Eye,
  EyeOff,
  Edit,
  Plus,
  Minus,
  Check,
  X as XIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Copy,
  Scissors,
  Clipboard,
  Link,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageCircle,
  Send,
  Share,
  ThumbsUp,
  ThumbsDown,
  Smile as SmileIcon,
  Frown,
  Meh,
  Search
} from "lucide-react";
import EmojiPicker from "@/components/EmojiPicker";
import { useState } from "react";

dayjs.extend(relativeTime);

// Icon mapping for Lucide icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Folder,
  FolderOpen,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Upload,
  Settings,
  User,
  Users,
  Heart,
  Star,
  Home,
  Building,
  Camera,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Wifi,
  Battery,
  Zap,
  Sun,
  Coffee,
  Gift,
  ShoppingCart,
  CreditCard,
  Bookmark,
  Tag,
  Flag,
  Bell,
  Lock,
  Key,
  Shield,
  Eye,
  EyeOff,
  Edit,
  Plus,
  Minus,
  Check,
  XIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Copy,
  Scissors,
  Clipboard,
  Link,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageCircle,
  Send,
  Share,
  ThumbsUp,
  ThumbsDown,
  SmileIcon,
  Frown,
  Meh,
  Search,
};

// Helper function to render either emoji or icon
const renderIcon = (iconValue: string | undefined) => {
  if (!iconValue) return "📁";
  
  // Check if it's a Lucide icon name
  const IconComponent = ICON_MAP[iconValue];
  if (IconComponent) {
    return <IconComponent className="h-8 w-8 text-text-primary" />;
  }
  
  // Otherwise, it's an emoji
  return iconValue;
};

export default function Pages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedFolderId, folders, isLoading: foldersLoading } = useFolderContext();
  const { pages, isLoading: pagesLoading } = useFolderPages(selectedFolderId);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const selectedFolder = folders?.find(f => f.folder_id === selectedFolderId);

  if (foldersLoading) return <Loader />;

  function goToPage(id: string) {
    navigate({ to: "/page/$id", params: { id: id } });
  }

  async function handlePageCreate() {
    if (!selectedFolderId) return;

    const data = await createNewPage(undefined, selectedFolderId);

    if (data.data && data.data[0]?.page_id) {
      navigate({ to: "/page/$id", params: { id: data.data[0].page_id } });
    }
    if (data.error) {
      toast("An error occurred", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  async function handlePageDelete(pageId: string) {
    const data = await deletePage(pageId);

    if (data.data) {
      toast("Page deleted!");
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["folderPages"] });
      queryClient.invalidateQueries({ queryKey: ["folderPageCounts"] });
    }
    if (data.error) {
      toast("An error occurred", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  async function handleFolderNameUpdate(newName: string) {
    if (!selectedFolderId || !newName.trim() || newName === selectedFolder?.name) {
      setIsEditingName(false);
      return;
    }

    const data = await updateFolder(selectedFolderId, { name: newName.trim() });

    if (data.data) {
      toast("Folder name updated!");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    } else if (data.error) {
      toast("Failed to update folder name", {
        description: `Error: ${data.error.message}`,
      });
    }

    setIsEditingName(false);
  }

  async function handleEmojiSelect(emoji: string) {
    if (!selectedFolderId) return;

    const data = await updateFolder(selectedFolderId, { icon: emoji });

    if (data.data) {
      toast("Folder icon updated!");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    } else if (data.error) {
      toast("Failed to update folder icon", {
        description: `Error: ${data.error.message}`,
      });
    }
  }

  function startEditingName() {
    setEditingName(selectedFolder?.name || "");
    setIsEditingName(true);
  }

  function handleNameKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleFolderNameUpdate(editingName);
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  }

  return (
    <div className="mx-4 my-4 h-full w-full">
      {/* Enhanced Folder Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Folder Icon - Same height as name */}
          <button
            onClick={() => setIsEmojiPickerOpen(true)}
            className="flex items-center justify-center h-12 px-3 text-3xl transition-all duration-200 cursor-pointer rounded-lg hover:bg-background-hover"
            title="Click to change folder icon"
          >
            {renderIcon(selectedFolder?.icon)}
          </button>

          {/* Folder Name - Same height as icon */}
          {isEditingName ? (
            <div className="relative">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleFolderNameUpdate(editingName)}
                onKeyDown={handleNameKeyPress}
                className="h-12 px-3 text-2xl font-bold bg-background-input border-2 border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue font-virgil shadow-sm"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={startEditingName}
              className="h-12 px-3 text-2xl font-bold text-text-primary hover:bg-background-hover rounded-lg transition-all duration-200 text-left font-virgil"
              title="Click to edit folder name"
            >
              {selectedFolder?.name || "Untitled Folder"}
            </button>
          )}
        </div>

        <Button onClick={handlePageCreate} className="bg-accent-blue hover:bg-accent-blue/80">
          New Drawing
        </Button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {pagesLoading ? (
          <Loader />
        ) : pages && pages.length > 0 ? (
          pages.map((page) => (
            <Card
              key={page.page_id}
              className="group relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-background-secondary border-border"
              onClick={() => goToPage(page.page_id)}
            >
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold text-text-primary mb-2 truncate">
                  {page.name || "Untitled"}
                </CardTitle>
                <p className="text-sm text-text-muted">
                  {dayjs(page.updated_at).fromNow()}
                </p>
              </CardContent>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2
                  className="invisible h-4 w-4 cursor-pointer rounded-button text-text-muted transition-all hover:bg-background-hover hover:text-red-400 group-hover:visible p-1"
                  strokeWidth={2}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePageDelete(page.page_id);
                  }}
                />
              </div>
            </Card>
          ))
        ) : (
          <NoData name="Pages" />
        )}
      </div>

      {/* Emoji Picker Modal */}
      <EmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onEmojiSelect={handleEmojiSelect}
        currentEmoji={selectedFolder?.icon}
      />
    </div>
  );
}
