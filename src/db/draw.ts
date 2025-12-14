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
  folder_id?: string,
): Promise<DBResponse> {
  const { data: profile, error: profileError } = await supabase.auth.getUser();
  if (profile) {
    let finalFolderId = folder_id;

    // If no folder_id provided, get or create default folder
    if (!finalFolderId) {
      const defaultFolderResponse = await getDefaultFolder(profile.user!.id);
      if (defaultFolderResponse.data && defaultFolderResponse.data.length > 0) {
        finalFolderId = defaultFolderResponse.data[0].folder_id;
      } else {
        const newFolderResponse = await createDefaultFolder(profile.user!.id);
        if (newFolderResponse.data && newFolderResponse.data.length > 0) {
          finalFolderId = newFolderResponse.data[0].folder_id;
        }
      }
    }

    const { data, error } = await supabase
      .from(DB_NAME)
      .insert({
        user_id: profile.user?.id,
        page_elements: { elements },
        folder_id: finalFolderId,
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

export async function getPagesByFolder(user_id: string, folder_id: string): Promise<DBResponse> {
  const { data, error } = await supabase
    .from(DB_NAME)
    .select()
    .order("updated_at", { ascending: false })
    .eq("user_id", user_id)
    .eq("folder_id", folder_id)
    .eq("is_deleted", false);

  return { data, error };
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
  // First, get the user_id from the folder to find their default folder
  const { data: folderData, error: folderError } = await supabase
    .from(FOLDERS_DB_NAME)
    .select("user_id")
    .eq("folder_id", folder_id)
    .single();

  if (folderError) {
    return { data: null, error: folderError };
  }

  // Get or create default folder for the user
  const defaultFolderResponse = await getDefaultFolder(folderData.user_id);
  let defaultFolderId = null;

  if (defaultFolderResponse.data && defaultFolderResponse.data.length > 0) {
    defaultFolderId = defaultFolderResponse.data[0].folder_id;
  } else {
    // Create default folder if it doesn't exist
    const createDefaultResponse = await createDefaultFolder(folderData.user_id);
    if (createDefaultResponse.data && createDefaultResponse.data.length > 0) {
      defaultFolderId = createDefaultResponse.data[0].folder_id;
    }
  }

  if (defaultFolderId) {
    // Move all pages from the folder being deleted to the default folder
    await supabase
      .from(DB_NAME)
      .update({ folder_id: defaultFolderId })
      .eq("folder_id", folder_id);
  }

  // Now delete the folder
  const { data, error } = await supabase
    .from(FOLDERS_DB_NAME)
    .delete()
    .eq("folder_id", folder_id);

  return { data, error };
}
