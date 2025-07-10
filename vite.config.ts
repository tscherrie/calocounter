import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This is equivalent to --host
    hmr: {
        clientPort: 443
    },
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      '/api/openfoodfacts': {
        target: 'https://search.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openfoodfacts/, ''),
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
})
