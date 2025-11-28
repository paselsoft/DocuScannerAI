import { createClient } from '@supabase/supabase-js';

// Chiavi per il salvataggio locale se non presenti in env
const STORAGE_KEY_URL = 'docuscanner_supabase_url';
const STORAGE_KEY_KEY = 'docuscanner_supabase_key';

// Recupera le variabili da env o localStorage
const getEnvVar = (key: string, storageKey: string, placeholder: string) => {
  // @ts-ignore
  const envValue = process.env[key];
  const storedValue = localStorage.getItem(storageKey);
  
  if (envValue && envValue !== placeholder) return envValue;
  if (storedValue) return storedValue;
  return null;
};

const url = getEnvVar('VITE_SUPABASE_URL', STORAGE_KEY_URL, 'INSERISCI_QUI_URL_SUPABASE');
const key = getEnvVar('VITE_SUPABASE_ANON_KEY', STORAGE_KEY_KEY, 'INSERISCI_QUI_ANON_KEY_SUPABASE');

// Verifica se la configurazione è valida
export const isConfigured = () => !!(url && key && url.startsWith('http'));

// Per evitare il crash "URL constructor" se l'URL non è valido, usiamo un placeholder sicuro durante l'init.
// L'app controllerà isConfigured() prima di provare a usare auth.
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