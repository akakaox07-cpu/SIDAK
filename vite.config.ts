import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // If VITE_USE_DEV_PROXY=true, proxy /gas -> Apps Script URL to bypass browser CORS in dev
    let proxy: Record<string, any> | undefined;
    if (mode === 'development' && env.VITE_USE_DEV_PROXY === 'true' && env.VITE_API_URL) {
      try {
        const url = new URL(env.VITE_API_URL);
        const target = `${url.protocol}//${url.host}`; // https://script.google.com
        const gasPath = url.pathname; // /macros/s/<DEPLOYMENT_ID>/exec
        proxy = {
          '/gas': {
            target,
            changeOrigin: true,
            secure: true,
            rewrite: () => gasPath, // always forward to exact GAS path
          },
        };
      } catch (e) {
        // ignore invalid URL; no proxy will be set
      }
    }
    return {
      base: '/SIDAK/',
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        cssCodeSplit: false,
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
