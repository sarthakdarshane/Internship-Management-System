import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Shared proxy options. changeOrigin rewrites the Host header, and removing the
// browser's Origin header makes each backend's CORS middleware treat the
// forwarded request as a trusted server-to-server call.
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  configure(proxy) {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('Origin');
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Route each microservice through the dev server so the browser only
      // ever talks to its own origin. This removes CORS/port-collision errors.
      '/api/auth': proxyOptions('http://localhost:5001'),
      '/api/internships': proxyOptions('http://localhost:5002'),
      '/api/tasks': proxyOptions('http://localhost:5003'),
      '/api/sentiment': proxyOptions('http://localhost:5004'),
      '/api/evaluations': proxyOptions('http://localhost:5005'),
      '/api/reports': proxyOptions('http://localhost:5006'),
    },
  },
})
