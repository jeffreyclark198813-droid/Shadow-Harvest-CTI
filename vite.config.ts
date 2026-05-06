import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Primary (optional) Gemini key
  const GEMINI_API_KEY = env.GEMINI_API_KEY || '';

  // Hardcoded free API endpoint (OpenRouter-compatible as an example)
  const FREE_API_BASE = 'https://openrouter.ai/api/v1';
  const FREE_API_KEY = 'sk-free-public-demo-key'; // replace with any free-tier key if needed

  // Automatic provider selection without breaking existing code
  const USE_FREE_API = !GEMINI_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    define: {
      // Preserve original variable for compatibility
      'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),

      // Inject seamless fallback system
      'process.env.API_BASE_URL': JSON.stringify(
        USE_FREE_API ? FREE_API_BASE : 'https://generativelanguage.googleapis.com'
      ),

      'process.env.API_KEY': JSON.stringify(
        USE_FREE_API ? FREE_API_KEY : GEMINI_API_KEY
      ),

      'process.env.API_PROVIDER': JSON.stringify(
        USE_FREE_API ? 'free' : 'gemini'
      ),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});