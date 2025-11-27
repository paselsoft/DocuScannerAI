import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    // Configurazione vitale per far funzionare process.env.API_KEY nel browser dopo il build
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    },
    server: {
      port: 8080,
      host: '0.0.0.0'
    },
    preview: {
      port: 8080,
      host: '0.0.0.0'
    }
  };
});