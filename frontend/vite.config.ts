import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
  },
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: {
        entry: "server",
      },
    }),
    viteReact(),
    nitro(),
  ],
});
