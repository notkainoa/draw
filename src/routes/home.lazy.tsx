import HomePageStatic from "@/views/HomePageStatic";
import { createLazyFileRoute } from "@tanstack/react-router";
import { ProfileOverlayProvider } from "@/contexts/ProfileOverlayContext";
import ProfileOverlay from "@/components/ProfileOverlay";

function HomePageWithProvider() {
  return (
    <ProfileOverlayProvider>
      <HomePageStatic />
      <ProfileOverlay />
    </ProfileOverlayProvider>
  );
}

export const Route = createLazyFileRoute("/home")({
  component: HomePageWithProvider,
});
