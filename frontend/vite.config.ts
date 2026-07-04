import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    // Railway (and other proxies) send Host headers Vite must allow in dev mode
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".up.railway.app",
      ".railway.app",
    ],
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
