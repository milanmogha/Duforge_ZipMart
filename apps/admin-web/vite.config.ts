import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Allow importing TS source from packages/* in the monorepo.
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
  },
  preview: { port: 5173 },
})
