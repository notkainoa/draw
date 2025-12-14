import { supabase } from "@/db/supabase";
import { User, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Authentication Error", { 
            description: "Failed to get session" 
          });
        }

        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
          isAuthenticated: !!session?.user,
        });
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
          isAuthenticated: !!session?.user,
        });

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            // Removed automatic sign-in toasts as they are not needed
            break;
          case 'SIGNED_OUT':
            toast.info("Signed out successfully");
            break;
          case 'TOKEN_REFRESHED':
            console.log("Token refreshed");
            break;
          case 'USER_UPDATED':
            console.log("User updated");
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}

// Enhanced version of the original isAuthenticated function
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
    return !!data.user;
  } catch (error) {
    console.error("Error in isAuthenticated:", error);
    return false;
  }
}

// Helper function to get user profile information
export async function getUserProfile() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: error || new Error("No user found") };
    }

    // Extract user information including OAuth provider data
    const profile = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      provider: user.app_metadata?.provider || 'email',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };

    return { user: profile, error: null };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { user: null, error };
  }
}
