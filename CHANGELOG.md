# Changelog

Tutti i cambiamenti notevoli a questo progetto saranno documentati in questo file.

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