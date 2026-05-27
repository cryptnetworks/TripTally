import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TripTally",
    short_name: "TripTally",
    description: "Track group trip expenses and settlements.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
