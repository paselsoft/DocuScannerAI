
# Changelog

Tutti i cambiamenti notevoli a questo progetto saranno documentati in questo file.

## [0.12.0-beta] - 2025-02-24
### Added
- **Global Search (Ricerca Globale):**
    - Nuova barra di ricerca nell'intestazione dell'Archivio Cloud.
    - Filtro in tempo reale su **tutti** i campi del documento (Nome, Cognome, CF, Città, Numero Documento).
    - Permette di trovare istantaneamente una pratica specifica anche in archivi molto grandi.

## [0.11.0-beta] - 2025-02-24
### Added
- **Chat with Document (Chiedi all'AI):** Nuova funzionalità che permette di interrogare Gemini riguardo il documento caricato.
    - Interfaccia chat dedicata accessibile dalla toolbar.
    - L'AI ha accesso visivo alle immagini del documento (Fronte/Retro) per rispondere a domande non standard (es. "Ci sono timbri?", "Traduci le note").
    - Cronologia chat persistente per ogni sessione di lavoro.
    - **Supporto Archivio:** La chat funziona anche con i documenti caricati dall'archivio (senza immagini), utilizzando i dati estratti come contesto.

## [0.10.0-beta] - 2025-02-24
### Added
- **Smart Dashboard:** L'archivio cloud è stato completamente ridisegnato per includere informazioni vitali sullo stato del documento.
- **Expiration Monitor:** Nuova logica (`dateUtils`) che calcola i giorni rimanenti alla scadenza di ogni documento.
- **Visual Badges:** Le card dei documenti ora mostrano badge colorati:
    - 🔴 **Scaduto:** Il documento non è più valido.
    - 🟡 **In Scadenza:** Mancano meno di 90 giorni.
    - 🟢 **Valido:** Il documento è in regola.
- **Sorting:** Aggiunta nuova opzione di ordinamento "Per Scadenza" per visualizzare immediatamente i documenti che richiedono attenzione.

## [0.9.0-beta] - 2025-02-24
### Added
- **Clipboard Support (Incolla):** Ora è possibile incollare immagini (CTRL+V) direttamente dall'area di upload. L'app rileva automaticamente l'immagine dagli appunti e la carica, velocizzando il flusso di lavoro per screenshot o immagini copiate da altre app.
- **Smart Formatting:**
    - I campi **Data** aggiungono automaticamente gli slash (`/`) durante la digitazione (es. `01012000` -> `01/01/2000`).
    - I campi **Codice Fiscale** e **Targhe** convertono automaticamente il testo in MAIUSCOLO.
    - Il campo **Sesso** è limitato a 1 carattere maiuscolo.

## [0.8.1-beta] - 2025-02-24
### Fixed
- **Mobile Sharing Fix:** Risolto un "falso positivo" che generava un errore in console quando l'utente annullava manualmente la condivisione nativa su mobile. Ora l'azione viene gestita silenziosamente.

## [0.8.0-beta] - 2025-02-24
### Added
- **Rotazione Immagini:** Pulsante per ruotare di 90° le immagini caricate direttamente nell'anteprima, ideale per correggere l'orientamento delle foto da mobile.
- **Condivisione Nativa:** Integrazione con la **Web Share API** (iOS/Android Share Sheet). È ora possibile condividere il file CSV estratto direttamente tramite WhatsApp, Mail, AirDrop, ecc. senza scaricarlo.

## [0.7.0-beta] - 2025-02-24
### Added
- **PWA (Progressive Web App):** L'applicazione è ora installabile su dispositivi Desktop e Mobile.
- **Service Worker:** Aggiunto supporto offline di base per velocizzare il caricamento della shell dell'applicazione.
- **Mobile Experience:** Modalità "Standalone" abilitata: rimuove la barra degli indirizzi del browser su iOS e Android per un look & feel nativo.
- **Icone:** Aggiunta icona applicazione vettoriale (SVG).

## [0.6.0-beta] - 2025-02-24
### Added
- **Direct Camera Capture:** Aggiunto un pulsante "Scatta Foto" nell'area di upload.
- **Mobile Optimized:** Su dispositivi mobili (iPhone/iPad/Android), apre direttamente la fotocamera posteriore per uno scatto immediato, bypassando la galleria e la selezione file.

## [0.5.0-beta] - 2025-02-24
### Added
- **Reverse Engineering Codice Fiscale:** Nuova logica matematica (`fiscalCodeUtils`) che permette di estrarre Data di Nascita e Sesso direttamente dal Codice Fiscale.
- **Data Enrichment:** Se il campo "Sesso" o "Data di Nascita" non viene letto correttamente dall'AI (o se l'immagine è sfocata), l'app lo calcola automaticamente dal CF (estratto via Barcode o OCR).
- **Nuovo Campo UI:** Aggiunto il campo "Sesso" (M/F) nel form dei risultati e nell'export CSV.

## [0.4.0-beta] - 2025-02-24
### Added
- **HEIC Support:** Aggiunta integrazione con la libreria `heic2any`. Ora è possibile caricare direttamente foto in formato `.heic` (standard iPhone/Apple).
- **Auto-Conversion:** I file HEIC vengono rilevati e convertiti automaticamente in JPEG nel browser prima di essere analizzati, eliminando la necessità di modificare le impostazioni della fotocamera.

## [0.3.0-beta] - 2025-02-24
### Added
- **Universal Scanner:** Aggiornamento della libreria di scansione da `jsQR` a `@zxing/library`.
- **Barcode 1D:** Aggiunto supporto per la lettura dei codici a barre lineari (Code 39, Code 128) presenti sul retro della **Tessera Sanitaria**.
- **QR Code 2D:** Mantenuto supporto per QR Code (es. Carta d'Identità Elettronica).
- **Validazione Fiscale:** Il sistema ora estrae e valida il Codice Fiscale sia dai QR che dai Barcode lineari, garantendo precisione assoluta.

## [0.2.2-beta] - 2025-02-24
### Stability
- **Logout Robusto:** Migliorata la procedura di logout con pulizia manuale del LocalStorage per prevenire sessioni fantasma su Cloud Run.
- **Session Auto-Healing:** Risolto un bug che bloccava l'interfaccia dopo il caricamento di documenti a causa di disallineamenti dell'ID sessione.

## [0.2.1-beta] - 2025-02-24
### Security & Sync
- **Cloud Key Sync:** Implementata sincronizzazione automatica della chiave di crittografia tramite Supabase (`user_keys`).
- **Device Continuity:** Le chiavi generate su un dispositivo (es. Preview) vengono ora propagate automaticamente agli altri (es. Cloud Run) al login, risolvendo l'errore "Dati Illeggibili".

### Reliability
- **Error Boundary:** Introdotta una barriera di protezione contro i crash globali dell'applicazione. Ora viene mostrata una UI di cortesia con opzioni di ripristino invece di una pagina bianca.
- **Hard Reset:** Aggiunta funzione di pulizia completa della cache locale in caso di errori persistenti.

### Features
- **Export CSV:** Aggiunta la possibilità di scaricare i dati estratti in formato CSV per l'uso in Excel o Google Sheets.

## [0.2.0-beta] - 2025-02-24
### Security
- **Crittografia E2EE:** Implementata crittografia AES-GCM lato client. I dati vengono cifrati prima dell'invio a Supabase e decifrati al recupero.
- **Privacy:** Il database ospita ora solo payload cifrati (illeggibili lato server).

### Changed
- Aggiornato `dbService` per gestire trasparentemente cifratura e decifratura.
- Aggiunta icona "Lucchetto" nella lista documenti per distinguere i file cifrati.
- Aggiornato numero versione nel footer.

## [0.1.0] - 2025-02-24
### Added
- **Core:** Integrazione con **Google Gemini 3 Pro Preview** per l'estrazione OCR intelligente e ragionamento avanzato sui documenti.
- **UI/UX:** Interfaccia multi-tab per gestire più documenti contemporaneamente.
- **Storage:** Integrazione con Supabase per il salvataggio persistente dei dati estratti (RLS policies attive).
- **Auth:** Sistema di Login/Registrazione utente.
- **PDF:** Generazione automatica del modulo "Legalizzazione di Fotografia" precompilato.
- **JotForm:** Esportazione diretta dei dati verso moduli JotForm con mappatura dinamica.
- **Campi:** Supporto avanzato per l'estrazione della "Data Rilascio" dalle patenti (campo 4a).
- **Feedback:** Sistema di notifiche Toast per feedback utente immediato.

### Fixed
- Corretto bug nel rendering del PDF che causava errori di sintassi a causa di stringhe Base64 troppo lunghe.
- Corretta gestione del click sulla lista documenti nell'archivio cloud.
- Stabilizzazione dipendenze e correzione riferimenti ai modelli AI.