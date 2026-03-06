import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('socket.io-client')) return 'vendor-socket';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
