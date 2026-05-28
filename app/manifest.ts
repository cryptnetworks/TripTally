import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trip Tally",
    short_name: "Trip Tally",
    description: "Track travel expenses and split trip costs easily.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/branding/logo-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/branding/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
