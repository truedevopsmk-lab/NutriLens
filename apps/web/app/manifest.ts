import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriLens",
    short_name: "NutriLens",
    description: "AI meal logging, macro tracking, and wearable sync.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#11131a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icons/maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
