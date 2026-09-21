import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AD Church",
    short_name: "AD Church",
    description: "Bíblia, hinários e vida congregacional.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#0b2447",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
