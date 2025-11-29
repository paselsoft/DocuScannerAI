# DocuScanner AI

**Versione:** 0.3.0-beta

DocuScanner AI è un'applicazione web moderna progettata per semplificare l'estrazione dati da documenti d'identità italiani (Carta d'Identità, Patente, Tessera Sanitaria) e automatizzare processi burocratici come la compilazione di moduli e l'inserimento dati in sistemi esterni.

## Caratteristiche Principali

*   **Intelligenza Artificiale:** Utilizza **Google Gemini 3 Pro** (via `@google/genai` SDK) per analizzare immagini e PDF con massima precisione e capacità di ragionamento.
*   **Scansione QR Code:** Rileva automaticamente codici QR nei documenti (es. CIE) per estrarre il Codice Fiscale con precisione del 100%, correggendo eventuali errori OCR.
*   **Sicurezza E2EE:** I dati sensibili vengono **cifrati direttamente nel browser** (AES-GCM) prima di essere inviati al database. Supabase archivia solo dati incomprensibili.
*   **Gestione Multipla:** Carica e lavora su più documenti in parallelo grazie all'interfaccia a schede.
*   **Archivio Cloud:** I dati cifrati vengono salvati su Supabase con autenticazione utente.
*   **Generazione PDF:** Crea al volo moduli PDF standard (es. Legalizzazione Foto) già compilati con i dati estratti.
*   **Esportazione Dati:** Scarica i dati in formato **CSV** (per Excel) o inoltrali automaticamente a **JotForm**.

## Stack Tecnologico

*   **Frontend:** React 19, TypeScript, Tailwind CSS, Vite.
*   **AI:** Google Gemini API (`gemini-3-pro-preview`).
*   **QR Scanning:** `jsqr` (elaborazione locale immagini).
*   **Security:** Web Crypto API (AES-GCM 256-bit).
*   **Backend/Auth:** Supabase (Auth & Database).
*   **PDF Tools:** `jspdf` per la generazione, `pdfjs-dist` per l'anteprima.

## Sicurezza e Crittografia

Dalla versione **0.2.0**, l'applicazione implementa la crittografia Client-Side:
1.  Il browser genera una chiave di crittografia unica.
2.  I dati estratti dall'AI vengono cifrati localmente.
3.  Solo il payload cifrato viene inviato a Supabase.
4.  Al recupero, i dati vengono decifrati automaticamente nel browser dell'utente.

*Nota: La chiave di crittografia è attualmente salvata nel LocalStorage del browser. Se si pulisce la cache, i dati storici non saranno più recuperabili.*

## Configurazione Database (Supabase)

Per far funzionare il backend e la sincronizzazione delle chiavi, esegui questi script SQL nel tuo progetto Supabase:

```sql
-- 1. Tabella Documenti (Dati cifrati)
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  doc_type text,
  summary text,
  content jsonb
);

alter table documents enable row level security;

create policy "Users can see own documents" on documents for select using ( auth.uid() = user_id );
create policy "Users can insert own documents" on documents for insert with check ( auth.uid() = user_id );
create policy "Users can delete own documents" on documents for delete using ( auth.uid() = user_id );

-- 2. Tabella Chiavi Utente (Sync crittografia)
create table user_keys (
  user_id uuid references auth.users not null primary key,
  master_key text not null,
  created_at timestamp with time zone default now()
);

alter table user_keys enable row level security;

create policy "Users can manage own key" on user_keys
  for all using ( auth.uid() = user_id );
```

## Installazione e Avvio

1.  Clona il repository.
2.  Installa le dipendenze: `npm install`
3.  Avvia in sviluppo: `npm run dev`
4.  Apri il browser e configura le chiavi API quando richiesto (se non presenti nel file `.env`).