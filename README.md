# DocuScanner AI

**Versione:** 0.1.0

DocuScanner AI è un'applicazione web moderna progettata per semplificare l'estrazione dati da documenti d'identità italiani (Carta d'Identità, Patente, Tessera Sanitaria) e automatizzare processi burocratici come la compilazione di moduli e l'inserimento dati in sistemi esterni.

## Caratteristiche Principali

*   **Intelligenza Artificiale:** Utilizza Google Gemini 2.0 Flash (via `@google/genai` SDK) per analizzare immagini e PDF con precisione elevata.
*   **Gestione Multipla:** Carica e lavora su più documenti in parallelo grazie all'interfaccia a schede.
*   **Archivio Cloud:** I dati vengono salvati in modo sicuro su un database PostgreSQL (Supabase) con autenticazione utente.
*   **Generazione PDF:** Crea al volo moduli PDF standard (es. Legalizzazione Foto) già compilati con i dati estratti.
*   **Integrazione JotForm:** Collega l'app ai tuoi form online esistenti per popolare automaticamente i campi.

## Stack Tecnologico

*   **Frontend:** React 19, TypeScript, Tailwind CSS, Vite.
*   **AI:** Google Gemini API (`gemini-2.5-flash` / `gemini-3-pro-preview`).
*   **Backend/Auth:** Supabase (Auth & Database).
*   **PDF Tools:** `jspdf` per la generazione, `pdfjs-dist` per l'anteprima.

## Configurazione Database (Supabase)

Per far funzionare il backend, esegui questo script SQL nel tuo progetto Supabase:

```sql
-- Creazione tabella documenti
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  doc_type text,
  summary text,
  content jsonb
);

-- Sicurezza (Row Level Security)
alter table documents enable row level security;

create policy "Users can see own documents" on documents for select using ( auth.uid() = user_id );
create policy "Users can insert own documents" on documents for insert with check ( auth.uid() = user_id );
create policy "Users can delete own documents" on documents for delete using ( auth.uid() = user_id );
```

## Installazione e Avvio

1.  Clona il repository.
2.  Installa le dipendenze: `npm install`
3.  Avvia in sviluppo: `npm run dev`
4.  Apri il browser e configura le chiavi API quando richiesto (se non presenti nel file `.env`).
