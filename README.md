
# DocuScanner AI

**Versione:** 0.19.13-beta

DocuScanner AI è un'applicazione web moderna progettata per semplificare l'estrazione dati da documenti d'identità italiani (Carta d'Identità, Patente, Tessera Sanitaria) e automatizzare processi burocratici come la compilazione di moduli e l'inserimento dati in sistemi esterni.

## Caratteristiche Principali

*   **Calendar Integration:** Esporta le scadenze dei documenti direttamente nel tuo calendario (Google, Apple, Outlook). Genera automaticamente eventi con promemoria a 1 settimana e 1 giorno.
*   **Archive Statistics Widget:** Un riquadro di riepilogo in cima all'archivio che mostra a colpo d'occhio:
    *   Totale documenti archiviati.
    *   Numero di documenti **scaduti**.
    *   Numero di documenti **in scadenza** entro 30 giorni (Urgenti).
*   **PDF Data Sheet:** Genera una scheda riepilogativa professionale con tutti i dati del documento, pronta per la stampa o l'invio via email.
*   **Custom Tags:** Organizza i documenti con etichette personalizzate (es. "Lavoro", "Banca"). I tag sono colorati automaticamente e crittografati E2EE per la massima privacy.
*   **Bulk Actions:** Gestione massiva dell'archivio. Selezione multipla, eliminazione di gruppo ed esportazione CSV cumulativa.
*   **Dark Mode:** Interfaccia completa in modalità scura per uso notturno, con toggle istantaneo e persistenza della preferenza.
*   **Global Search:** Ricerca istantanea nell'intero archivio documenti (trova per Nome, CF, Città, ecc.).
*   **Chiedi all'AI:** Chat contestuale integrata per fare domande libere sul documento caricato (es. "Ci sono firme?", "Traduci le note").
    *   **Reset Conversazione:** Pulsante per pulire la cronologia della chat e iniziare un nuovo contesto.
*   **Smart Dashboard:** Monitora automaticamente le **scadenze** dei tuoi documenti.
    *   **Badges Visuali:** Indicatori di stato immediati (Valido 🟢, In Scadenza 🟡, Scaduto 🔴).
    *   **Calcolo Giorni:** Visualizza esattamente quanti giorni mancano al rinnovo.
    *   **Ordinamento Intelligente:** Ordina l'archivio per data di scadenza per vedere subito le priorità.
*   **PWA Installabile:** L'applicazione può essere installata su Home Screen (iOS/Android) o Desktop, funzionando come un'app nativa a schermo intero.
*   **Speed & Comfort Update:**
    *   **Incolla Rapido (CTRL+V):** Carica immagini direttamente dagli appunti.
    *   **Smart Formatting:** Formattazione automatica per Date, Codici Fiscali e Targhe.
*   **Mobile Experience Pack:** 
    *   **Rotazione Immagini:** Correggi l'orientamento delle scansioni direttamente nell'app.
    *   **Condivisione Nativa:** Invia i dati estratti via WhatsApp/AirDrop.
    *   **Scatto Diretto:** Accesso immediato alla fotocamera posteriore.
*   **Intelligenza Artificiale:** Utilizza **Google Gemini 3 Pro** (via `@google/genai` SDK) per analizzare immagini e PDF con massima precisione e capacità di ragionamento.
*   **Reverse Engineering CF:** Calcola matematicamente **Sesso** e **Data di Nascita** direttamente dal Codice Fiscale.
*   **Scanner Universale (Barcode & QR):** Rileva automaticamente **Codici a Barre** e **QR Code** per estrarre il Codice Fiscale.
*   **Sicurezza E2EE:** Crittografia AES-GCM lato client. I dati arrivano al server già cifrati.
*   **Gestione Multipla:** Carica e lavora su più documenti in parallelo.
*   **Generazione PDF:** Crea al volo moduli PDF standard (es. Legalizzazione Foto).
*   **Esportazione Dati:** CSV e integrazione diretta con JotForm.

## Stack Tecnologico

*   **Frontend:** React 19, TypeScript, Tailwind CSS, Vite.
*   **Theme:** Tailwind Dark Mode (Class based).
*   **PWA:** Service Worker, Web App Manifest, Web Share API.
*   **AI:** Google Gemini API (`gemini-3-pro-preview`).
*   **Image Processing:** `heic2any`, `pdfjs-dist`, Canvas API.
*   **Barcode Scanning:** `@zxing/library`.
*   **Security:** Web Crypto API (AES-GCM 256-bit).
*   **Backend/Auth:** Supabase (Auth & Database).

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
create policy "Users can update own documents" on documents for update using ( auth.uid() = user_id );

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
4.  Apri il browser e configura le chiavi API quando richiesto.