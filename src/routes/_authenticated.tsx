import isAuthenticated from "@/hooks/isAuthenticated";
import Layout from "@/views/Layout";
import { createFileRoute, redirect, isRedirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        throw redirect({
          to: "/",
          replace: true,
        });
      }
    } catch (error) {
      // If it's a redirect, rethrow it
      if (isRedirect(error)) {
        throw error;
      }
      // For any other error, redirect to home page
      console.error("Authentication check failed in route guard:", error);
      throw redirect({
        to: "/",
        replace: true,
      });
    }
  },
  component: Layout,
});
