import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Whole app is served under /admin (root reserved for a future showcase site).
// `base` makes built asset URLs resolve under /admin/.
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  server: {
    port: 5173,
    // Proxy API calls to the Express server during local dev.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
