import { Button } from "@/components/ui/button";
import { GITHUB_REPO_URL } from "@/constants";
import isAuthenticated from "@/hooks/isAuthenticated";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export default function HomePage() {
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["user", "authenticated"],
    queryFn: () => isAuthenticated(),
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
  });

  // Set a timeout for loading state to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        console.warn("Authentication check timed out after 10 seconds");
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Log errors for debugging
  if (error) {
    console.error("Authentication query error:", error);
  }

  useEffect(() => {
    if (data === true) {
      navigate({ to: "/pages" });
    }
  }, [data, navigate]);

  function action(authenticated: boolean) {
    if (authenticated === true) {
      navigate({ to: "/pages" });
    } else {
      navigate({ to: "/login", replace: true });
    }
  }
  return (
    <main className="flex h-full w-full flex-col bg-background-main p-4 font-sans">
      <footer>
        <div className="flex h-12 w-full items-center justify-center">
          <div className="flex flex-row items-center justify-center align-middle">
            <h1 className="text-sm text-text-secondary">
              ⭐ Star us on{" "}
              <a href={GITHUB_REPO_URL} className="font-medium underline text-accent-blue hover:text-blue-400 transition-colors">
                GitHub
              </a>
            </h1>
          </div>
        </div>
      </footer>
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-fit w-full flex-col items-center gap-y-6 sm:w-1/2 px-8">
          <h1 className="text-5xl font-bold text-text-primary font-virgil">Draw</h1>
          <h2 className="text-center text-2xl font-normal text-text-secondary leading-relaxed">
            The digital drawing tool that enables you to create, edit, and share
            your drawings across all your devices.
          </h2>
          <Button
            isLoading={isLoading && !loadingTimeout}
            loadingText=""
            className="px-8 text-sm font-medium"
            size="lg"
            onClick={() => action(data ? true : false)}
            disabled={loadingTimeout}
          >
            {loadingTimeout
              ? "Connection timeout - Try again"
              : data
                ? "View your pages"
                : "Sign In"
            }
          </Button>
        </div>
      </div>
      <footer>
        <div className="flex h-12 w-full items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center sm:flex-row sm:gap-x-2">
            <p className="text-sm text-text-secondary">
              Forked from{" "}
              <a
                href="https://github.com/macintushar/draw"
                className="font-medium text-accent-blue hover:text-blue-400 transition-colors underline"
              >
                Macintushar
              </a>
              ,
            </p>
            <p className="text-sm text-text-secondary">
              tweaked by{" "}
              <a
                href="https://github.com/KainoaNewton"
                className="font-medium text-accent-blue hover:text-blue-400 transition-colors underline"
              >
                Kainoa Newton
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
