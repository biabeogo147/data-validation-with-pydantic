import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

function resolveBasePath(): string {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) {
    return explicitBase.endsWith('/') ? explicitBase : `${explicitBase}/`;
  }

  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (process.env.GITHUB_ACTIONS && repository) {
    return `/${repository}/`;
  }

  return '/';
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['pyodide'],
  },
});
