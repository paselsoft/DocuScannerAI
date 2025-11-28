import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    // Configurazione vitale per far funzionare process.env.API_KEY e le variabili Supabase nel browser
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
      // Inseriamo le credenziali fornite come fallback se non presenti nel .env
      'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "https://izgaiowpgmakcyimryex.supabase.co"),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6Z2Fpb3dwZ21ha2N5aW1yeWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTUzNjgsImV4cCI6MjA3OTgzMTM2OH0.XRqiPqyQz5ynRB4rAFugoi-Fsxd-AuutM_KTzs129sU")
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