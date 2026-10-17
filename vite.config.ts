import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxyHeaders: Record<string, string> = {
    'User-Agent': 'AirspaceControl-ATC/1.0',
  };

  // If user provides OpenSky credentials, securely inject them server-side into the proxy
  if (env.OPENSKY_API_KEY) {
    proxyHeaders['Authorization'] = `Bearer ${env.OPENSKY_API_KEY}`;
  } else if (env.OPENSKY_USERNAME && env.OPENSKY_PASSWORD) {
    const credentials = Buffer.from(
      `${env.OPENSKY_USERNAME}:${env.OPENSKY_PASSWORD}`
    ).toString('base64');
    proxyHeaders['Authorization'] = `Basic ${credentials}`;
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/opensky': {
          target: 'https://opensky-network.org/api',
          changeOrigin: true,
          timeout: 6000,
          proxyTimeout: 6000,
          rewrite: (path) => path.replace(/^\/api\/opensky/, ''),
          headers: proxyHeaders,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              // Gracefully handle ETIMEDOUT / ECONNREFUSED without crashing or unhandled proxy log
              const httpRes = res as import('http').ServerResponse;
              if (httpRes && !httpRes.headersSent) {
                httpRes.writeHead(504, { 'Content-Type': 'application/json' });
                httpRes.end(
                  JSON.stringify({
                    error: 'OpenSky Network server timed out (ETIMEDOUT). The external host is currently unreachable from this environment.',
                    code: 'ETIMEDOUT',
                  })
                );
              }
            });
          },
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
