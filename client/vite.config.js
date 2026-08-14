import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Whole app is served under /admin when hosted on cPanel/Express (root reserved for a future showcase site).
// On Vercel, serve directly at root /.
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/admin/',
  server: {
    port: 5173,
    // Proxy API calls to the Express server during local dev.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
