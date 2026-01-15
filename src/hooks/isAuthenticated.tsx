import { supabase } from "@/db/supabase";

export default async function isAuthenticated() {
  try {
    // Use getSession() instead of getUser() for faster local check
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Authentication check error:", error);
      return false;
    }

    return !!data.session;
  } catch (error) {
    console.error("Authentication check failed:", error);
    return false;
  }
}
