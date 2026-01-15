import HomePageStatic from "@/views/HomePageStatic";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/home")({
  component: HomePageStatic,
});
