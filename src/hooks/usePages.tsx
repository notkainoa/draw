import { useQuery } from "@tanstack/react-query";
import { getPages } from "../db/draw";
import { getLocalUser } from "../db/auth";
import { toast } from "sonner";

export interface PageData {
  page_id: string;
  name: string;
  updated_at: string;
  user_id: string;
  is_deleted: boolean;
  page_elements?: any;
  folder_id?: string;
}

export function usePages() {
  const {
    data,
    isLoading,
    refetch: refetchPages,
  } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const user_session = await getLocalUser();
      if (!user_session.error) {
        if (!user_session.data.session) {
          toast.error("Something went wrong!");
          return { data: null, error: null };
        }
        return getPages(user_session?.data.session.user?.id ?? "");
      }
      return null;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Show error toast if there's an error
  if (data?.error) {
    toast(data.error.message);
  }

  return {
    pages: (data?.data as PageData[]) || [],
    isLoading,
    error: data?.error,
    refetchPages,
  };
}
