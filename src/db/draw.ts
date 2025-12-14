import { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { supabase } from "./supabase";
import { AuthError, PostgrestError } from "@supabase/supabase-js";

export type DBResponse = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[] | null;
  error: PostgrestError | AuthError | null;
};

export const DB_NAME = "draw";
export const FOLDERS_DB_NAME = "folders";

// Cache parsed unlimited users list to avoid repeated parsing
let cachedUnlimitedUsers: string[] = [];
let cachedUnlimitedUsersEnv: string | undefined = undefined;

function getUnlimitedUsers(): string[] {
  const unlimitedUsersEnv = import.meta.env.VITE_UNLIMITED_USERS;
  
  // Return cached list if environment variable hasn't changed
  if (unlimitedUsersEnv === cachedUnlimitedUsersEnv) {
    return cachedUnlimitedUsers;
  }
  
  // Parse and cache the list
  cachedUnlimitedUsersEnv = unlimitedUsersEnv;
  if (unlimitedUsersEnv) {
    cachedUnlimitedUsers = unlimitedUsersEnv.split(',').map((email: string) => email.trim().toLowerCase());
  } else {
    cachedUnlimitedUsers = [];
  }
  
  return cachedUnlimitedUsers;
}

export type Folder = {
  folder_id: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export async function getPages(user_id: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(DB_NAME)
    .select()
    .order("updated_at", { ascending: false })
    .eq("user_id", user_id)
    .eq("is_deleted", false);

  return { data, error };
}

export async function getDrawData(id: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(DB_NAME)
    .select()
    .eq("page_id", id);

  return { data, error };
}

export async function createNewPage(
  elements?: readonly NonDeletedExcalidrawElement[],
  folder_id?: string | null,
): Promise<DBResponse> {
  const { data: profile, error: profileError } = await supabase.auth.getUser();
  if (profile) {
    // Check drawing limit if environment variable is set
    const maxDrawings = import.meta.env.VITE_MAX_DRAWINGS_PER_USER;
    if (maxDrawings) {
      const limit = parseInt(maxDrawings, 10);
      if (!isNaN(limit) && limit > 0) {
        // Check if user is in the unlimited users list (bypass list)
        const userEmail = profile.user?.email;
        let isUnlimitedUser = false;

        if (userEmail) {
          const unlimitedUsers = getUnlimitedUsers();
          isUnlimitedUser = unlimitedUsers.includes(userEmail.toLowerCase());
        }

        // Only enforce limit if user is not in the unlimited users list
        if (!isUnlimitedUser) {
          // Count existing non-deleted drawings for this user
          const { count, error: countError } = await supabase
            .from(DB_NAME)
            .select('page_id', { count: 'exact', head: true })
            .eq("user_id", profile.user?.id)
            .eq("is_deleted", false);

          if (countError) {
            return { data: null, error: countError };
          }

          if (count !== null && count >= limit) {
            // Create a custom error to indicate limit reached
            const limitError: PostgrestError = {
              message: `You have reached the maximum limit of ${limit} drawing${limit === 1 ? '' : 's'}. Please delete some drawings to create new ones.`,
              details: '',
              hint: '',
              code: 'DrawingLimitReached',
              name: 'PostgrestError',
            };
            return { data: null, error: limitError };
          }
        }
      }
    }

    const { data, error } = await supabase
      .from(DB_NAME)
      .insert({
        user_id: profile.user?.id,
        page_elements: { elements },
        folder_id: folder_id ?? null,
        name: "Untitled"
      })
      .select();
    return { data, error };
  }
  return { data: null, error: profileError };
}

export async function setDrawData(
  id: string,
  elements: readonly NonDeletedExcalidrawElement[],
  name: string,
): Promise<DBResponse> {
  const updateTime = new Date().toISOString();
  const { data, error } = await supabase
    .from(DB_NAME)
    .update({ name: name, page_elements: { elements }, updated_at: updateTime })
    .eq("page_id", id)
    .select();

  return { data, error };
}

export async function deletePage(id: string): Promise<DBResponse> {
  const { error } = await supabase
    .from(DB_NAME)
    .update({ is_deleted: true })
    .eq("page_id", id);

  return { data: null, error };
}

export async function renamePage(page_id: string, newName: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(DB_NAME)
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq("page_id", page_id)
    .select();

  return { data, error };
}

// Folder-related functions
export async function getFolders(user_id: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(FOLDERS_DB_NAME)
    .select("folder_id, name, icon, created_at, updated_at, user_id")
    .order("created_at", { ascending: true })
    .eq("user_id", user_id);

  return { data, error };
}

export async function createFolder(name: string): Promise<DBResponse> {
  const { data: profile, error: profileError } = await supabase.auth.getUser();
  if (profile) {
    const { data, error } = await supabase
      .from(FOLDERS_DB_NAME)
      .insert({ user_id: profile.user?.id, name })
      .select("folder_id, name, icon, created_at, updated_at, user_id");
    return { data, error };
  }
  return { data: null, error: profileError };
}

export async function getPagesByFolder(user_id: string, folder_id: string | null): Promise<DBResponse> {
  let query = supabase
    .from(DB_NAME)
    .select()
    .order("updated_at", { ascending: false })
    .eq("user_id", user_id)
    .eq("is_deleted", false);

  if (folder_id) {
    query = query.eq("folder_id", folder_id);
  } else {
    query = query.is("folder_id", null);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function migrateDefaultFolderToRoot(user_id: string): Promise<void> {
  // Find "My Drawings" folder
  const { data: folders } = await supabase
    .from(FOLDERS_DB_NAME)
    .select("folder_id")
    .eq("user_id", user_id)
    .eq("name", "My Drawings")
    .limit(1);

  if (folders && folders.length > 0) {
    const folderId = folders[0].folder_id;

    // Move all pages from this folder to root (null)
    await supabase
      .from(DB_NAME)
      .update({ folder_id: null })
      .eq("folder_id", folderId);

    // Delete the folder
    await supabase
      .from(FOLDERS_DB_NAME)
      .delete()
      .eq("folder_id", folderId);
  }
}

export async function getDefaultFolder(user_id: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(FOLDERS_DB_NAME)
    .select()
    .eq("user_id", user_id)
    .order("created_at", { ascending: true })
    .limit(1);

  return { data, error };
}

export async function createDefaultFolder(user_id: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(FOLDERS_DB_NAME)
    .insert({ user_id, name: "My Drawings" })
    .select("folder_id, name, icon, created_at, updated_at, user_id");

  return { data, error };
}

export async function updateFolder(folder_id: string, updates: { name?: string; icon?: string }): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(FOLDERS_DB_NAME)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("folder_id", folder_id)
    .select("folder_id, name, icon, created_at, updated_at, user_id");

  return { data, error };
}

export async function renameFolder(folder_id: string, newName: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(FOLDERS_DB_NAME)
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq("folder_id", folder_id)
    .select();

  return { data, error };
}

export async function deleteFolder(folder_id: string): Promise<DBResponse> {
  // Verify the folder exists by attempting to fetch it
  const { error: folderError } = await supabase
    .from(FOLDERS_DB_NAME)
    .select("user_id")
    .eq("folder_id", folder_id)
    .single();

  if (folderError) {
    return { data: null, error: folderError };
  }

  // Move all pages from the folder being deleted to the root workspace (null)
  await supabase
    .from(DB_NAME)
    .update({ folder_id: null })
    .eq("folder_id", folder_id);

  // Now delete the folder
  const { data, error } = await supabase
    .from(FOLDERS_DB_NAME)
    .delete()
    .eq("folder_id", folder_id);

  return { data, error };
}
