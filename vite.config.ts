/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function geoJsonPlugin(): Plugin {
  return {
    name: 'geojson-loader',
    transform(code, id) {
      if (id.endsWith('.geojson')) {
        return {
          code: `export default ${code};`,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), geoJsonPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
