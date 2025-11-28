import { createClient } from '@supabase/supabase-js';

// Chiavi per il salvataggio locale se non presenti in env
const STORAGE_KEY_URL = 'docuscanner_supabase_url';
const STORAGE_KEY_KEY = 'docuscanner_supabase_key';

// Credenziali hardcoded fornite dall'utente come fallback finale
const DEFAULT_URL = "https://izgaiowpgmakcyimryex.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6Z2Fpb3dwZ21ha2N5aW1yeWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTUzNjgsImV4cCI6MjA3OTgzMTM2OH0.XRqiPqyQz5ynRB4rAFugoi-Fsxd-AuutM_KTzs129sU";

// Recupera le variabili da env o localStorage
const getEnvVar = (key: string, storageKey: string, defaultValue: string) => {
  // @ts-ignore
  const envValue = process.env[key];
  const storedValue = localStorage.getItem(storageKey);
  
  // Se la variabile d'ambiente esiste e non è un placeholder generico, usala
  if (envValue && !envValue.includes('INSERISCI_QUI')) return envValue;
  if (storedValue) return storedValue;
  return defaultValue;
};

const url = getEnvVar('VITE_SUPABASE_URL', STORAGE_KEY_URL, DEFAULT_URL);
const key = getEnvVar('VITE_SUPABASE_ANON_KEY', STORAGE_KEY_KEY, DEFAULT_KEY);

// Verifica se la configurazione è valida
export const isConfigured = () => !!(url && key && url.startsWith('http'));

// Per evitare il crash "URL constructor" se l'URL non è valido, usiamo un placeholder sicuro durante l'init.
const validUrl = isConfigured() ? url! : 'https://placeholder.supabase.co';
const validKey = isConfigured() ? key! : 'placeholder';

export const supabase = createClient(validUrl, validKey);

// Funzioni helper per salvare la configurazione da UI se manca il .env
export const saveSupabaseConfig = (newUrl: string, newKey: string) => {
    if (!newUrl.startsWith('http')) throw new Error("L'URL deve iniziare con http o https");
    localStorage.setItem(STORAGE_KEY_URL, newUrl.trim());
    localStorage.setItem(STORAGE_KEY_KEY, newKey.trim());
    window.location.reload();
}

export const clearSupabaseConfig = () => {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    window.location.reload();
}