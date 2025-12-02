
# Changelog

Tutti i cambiamenti notevoli a questo progetto saranno documentati in questo file.

## [0.21.0-beta] - 2025-02-25
### Added
- **Image Cropping (Ritaglio):** Implementato un potente strumento di ritaglio integrato nel caricamento.
    - Quando si carica un'immagine singola (Fronte o Retro), si apre automaticamente un editor a schermo intero.
    - Funzionalità incluse: Zoom, Pan, Rotazione e Griglia di ritaglio.
    - L'AI analizza solo la porzione ritagliata, migliorando drasticamente la precisione dell'OCR rimuovendo sfondi rumorosi.
    - Supporto per file HEIC (iPhone) che vengono convertiti automaticamente prima del ritaglio.
    - Interfaccia touch-friendly per dispositivi mobili.

## [0.20.5-beta] - 2025-02-25
### Fixed
- **PDF Worker Fix:** Risolto un errore critico (`error loading dynamically imported module`) durante il salvataggio di documenti PDF.
    - Aggiornato il percorso del worker di `pdfjs-dist` per utilizzare la versione `.mjs` (ES Module), necessaria per la compatibilità con le versioni recenti della libreria (v5+).

## [0.20.4-beta] - 2025-02-25
### Fixed
- **Image Delete Confirmation:** Sostituito il dialogo nativo `window.confirm` con un overlay di conferma integrato nell'immagine.
    - Risolve il problema del click "a vuoto" su dispositivi touch e browser che bloccano i popup nativi.
    - L'eliminazione dell'immagine ora richiede una conferma esplicita tramite pulsanti UI (Annulla/Conferma) direttamente sull'anteprima.

## [0.20.3-beta] - 2025-02-25
### Added
- **Image Replacement Logic:** Aggiunta la possibilità di rimuovere e sostituire le immagini esistenti nel modale di anteprima.
    - Un pulsante "Cestino" appare ora sopra le immagini già caricate (Fronte/Retro).
    - Cliccando su elimina, l'immagine viene rimossa dal documento e dal database, ripristinando l'area di upload per permettere il caricamento del file corretto.

## [0.20.2-beta] - 2025-02-25
### Added
- **Retroactive Image Upload:** Nuova funzionalità che permette di aggiungere immagini (Fronte/Retro) a documenti già salvati che ne erano sprovvisti.
    - Se un documento non ha un'immagine associata, nel tab "Immagini" del modale di anteprima appare un pulsante per caricarla.
    - L'immagine caricata viene compressa, cifrata e salvata automaticamente nel database senza dover ricaricare l'intero documento.

## [0.20.1-beta] - 2025-02-25
### Changed
- **Manual Analysis Button:** Ripristinato il controllo manuale sull'analisi dei documenti.
    - Rimossa l'analisi automatica al momento della selezione del file.
    - Aggiunto un pulsante centrale **"Analizza Documento"** che appare solo dopo aver caricato un file.
    - Migliorata la UX per caricamenti multi-file (fronte/retro) e prevenzione di chiamate API accidentali.

## [0.20.0-beta] - 2025-02-25
### Added
- **Encrypted Image Storage:** Implementato salvataggio delle immagini (Fronte/Retro) direttamente nel database cifrato.
    - **Compressione Smart:** Le immagini vengono ridimensionate (max 1024px) e compresse (JPEG 60%) prima del salvataggio per ottimizzare lo spazio e le prestazioni.
    - **Anteprima Immagini:** Il modale di anteprima ora include una scheda "Immagini" che permette di visualizzare le scansioni originali salvate nel cloud.
    - **Sicurezza:** Anche le immagini, essendo parte del payload JSON, beneficiano della crittografia E2EE (AES-GCM) client-side.
- **Update Logic Refinement:** Migliorata la gestione degli aggiornamenti: se si modificano solo i dati testuali di un documento, le immagini esistenti vengono preservate automaticamente senza doverle ricaricare.

## [0.19.13-beta] - 2025-02-24
### Fixed
- **DB Update Verification:** Rafforzata la logica di aggiornamento nel database (`saveDocumentToDb`).
    - Aggiunto controllo esplicito (`.select()`) per verificare che il database abbia effettivamente modificato il record.
    - Se l'aggiornamento fallisce silenziosamente (es. a causa di policy RLS mancanti), l'applicazione ora lancia un errore visibile invece di confermare falsamente il salvataggio.

## [0.19.12-beta] - 2025-02-24
### Security
- **RLS Policy Support:** Documentata e verificata la necessità della policy SQL `Users can update own documents` per permettere la modifica dei documenti (es. aggiunta Tag) che prima venivano bloccati dal database in scrittura.

## [0.19.11-beta] - 2025-02-24
### Fixed
- **Update vs Insert Logic:** Risolto un problema per cui la modifica di un documento già salvato (es. aggiunta di Tag) creava un duplicato invece di aggiornare l'originale.
    - Ora il pulsante di salvataggio rileva automaticamente se si sta lavorando su un documento esistente.
    - Il testo del pulsante cambia dinamicamente in "Aggiorna" (arancione) se si sta modificando, o "Salva" (verde) se è un nuovo documento.

## [0.19.10-beta] - 2025-02-24
### Fixed
- **PDF Layout Separation:** Modificato radicalmente il posizionamento degli elementi nel PDF "Legalizzazione".
    - Il riquadro FOTO è stato spostato in alto (`y=65`) per stare tra titolo e testo.
    - Il testo "Si legalizza la foto di..." è stato spostato significativamente in basso (`y=120`) per distanziarlo chiaramente dalla foto.
    - Il footer è stato riadattato (`y=220`) per seguire il flusso del testo.

## [0.19.9-beta] - 2025-02-24
### Fixed
- **PDF Legalizzazione (Vertical Balancing):** 
    - Aumentato lo spazio tra l'intestazione e l'inizio del modulo (spostato contenuto giù a `y=105`).
    - Ridotto lo spazio vuoto in fondo alla pagina, alzando il footer legale e la firma (spostato su a `y=200`).
    - Il risultato finale è un layout molto più equilibrato e professionale.

## [0.19.8-beta] - 2025-02-24
### Fixed
- **PDF Layout Fine Tuning:** Ulteriore perfezionamento del modulo Legalizzazione.
    - Spostato il riquadro foto in alto (`y=70`) per posizionarlo nello spazio tra il titolo e l'inizio del testo.
    - Ridotto significativamente lo spazio vuoto in fondo alla pagina spostando il footer e la firma verso l'alto (`y=230`).

## [0.19.7-beta] - 2025-02-24
### Fixed
- **PDF Layout Spacing:** Aumentato significativamente lo spazio verticale (`startY=90`) tra l'intestazione ("LEGALIZZAZIONE DI FOTOGRAFIA") e l'inizio del modulo ("Si legalizza la foto di...").
    - Il riquadro della foto e i dati anagrafici sono stati traslati verso il basso per centrare meglio il contenuto nella pagina e migliorare la leggibilità.

## [0.19.6-beta] - 2025-02-24
### Fixed
- **PDF Layout Refinement:** Ulteriore perfezionamento del modulo "Legalizzazione di Fotografia".
    - Risolto disallineamento visivo: Il testo "Si legalizza la foto di :" è ora perfettamente allineato con il bordo superiore del riquadro foto.
    - Layout compattato: Ridotti ulteriormente gli spazi verticali per una maggiore densità e fedeltà al modulo originale.
    - Allungate le linee di compilazione per sfruttare meglio la larghezza della pagina.

## [0.19.5-beta] - 2025-02-24
### Fixed
- **PDF Layout Compact:** Ottimizzato il modulo PDF "Legalizzazione".
    - Ridotta drasticamente l'interlinea tra le sezioni (Nomi, Nascita, Documento, Rilascio).
    - Il modulo risulta ora più compatto e simile al documento originale, risolvendo il problema degli spazi eccessivi tra le righe.

## [0.19.4-beta] - 2025-02-24
### Fixed
- **PDF Layout Legalizzazione:** Riprogettato completamente il modulo PDF di "Legalizzazione di Fotografia".
    - Il riquadro della fototessera è stato spostato a destra per evitare sovrapposizioni con i dati anagrafici.
    - Le linee per Cognome e Nome sono state ridimensionate e allineate a sinistra per rispettare il layout del documento originale della Motorizzazione.
    - Migliorata la spaziatura verticale delle sezioni.

## [0.19.3-beta] - 2025-02-24
### Fixed
- **Custom Delete Modal:** Sostituito il dialogo nativo `window.confirm` con un modale personalizzato per l'eliminazione dei documenti.
    - Questo risolve problemi di compatibilità su browser specifici (es. Firefox/Mac) dove il popup nativo poteva essere bloccato o non apparire correttamente, impedendo l'eliminazione.
    - Interfaccia coerente con il tema dell'applicazione (Dark/Light mode).
    - Supporto per conferma eliminazione singola e multipla.

## [0.19.2-beta] - 2025-02-24
### Fixed
- **UI Interaction Fix:** Risolto definitivamente il problema dei pulsanti "Elimina" sulle card che non rispondevano al click.
    - Aggiunto `type="button"` esplicito per prevenire conflitti con form browser.
    - Semplificata la logica di aggiornamento stato per garantire la reattività dell'interfaccia.
    - Utilizzo di `window.confirm` per evitare blocchi nei dialoghi di conferma.

## [0.19.1-beta] - 2025-02-24
### Fixed
- **Eliminazione Documenti:** Risolto un bug di "Race Condition" che impediva visivamente l'eliminazione dei documenti.
    - Implementata **Optimistic UI**: Il documento viene rimosso immediatamente dall'interfaccia al click, garantendo un feedback istantaneo all'utente, senza attendere la conferma del database.
    - Se l'eliminazione fallisce sul server, il documento viene ripristinato automaticamente e viene mostrato un errore.

## [0.19.0-beta] - 2025-02-24
### Added
- **Calendar Integration (.ics):** Nuova funzionalità "Esporta nel Calendario".
    - Permette di scaricare un file evento (.ics) compatibile con Google Calendar, Apple Calendar e Outlook.
    - L'evento include automaticamente:
        - Titolo standardizzato: "Scadenza [Tipo Doc] - [Nome]".
        - Data esatta di scadenza (evento tutto il giorno).
        - **Promemoria intelligenti:** Notifica automatica 1 settimana prima e 1 giorno prima della scadenza.
    - Pulsante aggiunto sia nella toolbar dei risultati post-scansione che nelle card dell'archivio.

## [0.18.0-beta] - 2025-02-24
### Added
- **Gestione Cronologia Chat:**
    - Aggiunto pulsante "Cestino" all'interno della Chat AI per resettare la conversazione corrente e iniziare un nuovo contesto.
    - La cronologia della chat viene ora pulita automaticamente quando si inizia una nuova scansione ("Nuovo Documento") per evitare contaminazioni tra sessioni diverse.
    - **Hardcoded Credentials Removal:** Rimosse email e password precompilate dal form di login per maggiore sicurezza.
- **User Settings:** Nuovo pannello di impostazioni utente accessibile dall'Header.
- **Change Password:** Aggiunta funzionalità per cambiare la password dell'account direttamente dall'applicazione.

## [0.17.0-beta] - 2025-02-24
### Added
- **Archive Statistics Widget:** Nuova barra di riepilogo nell'archivio cloud.
    - Visualizza a colpo d'occhio il totale dei documenti.
    - Evidenzia il numero di documenti scaduti (Rosso).
    - Segnala i documenti in scadenza entro 30 giorni (Giallo/Urgenti) per facilitare la gestione delle priorità.

## [0.16.0-beta] - 2025-02-24
### Added
- **Data Sheet PDF (Scheda Dati):** Nuova opzione di esportazione PDF.
    - Genera una scheda riepilogativa professionale con tutti i dati estratti (Anagrafica, Documento, Scadenze).
    - Layout tabellare pulito e moderno, ideale per l'invio via email o la stampa.
- **Advanced Print Menu:** Il pulsante "Stampa" ora apre un menu a tendina che permette di scegliere tra:
    - **Scheda Dati:** Il nuovo formato riepilogativo.
    - **Legalizzazione Foto:** Il formato classico per pratiche burocratiche.

## [0.15.0-beta] - 2025-02-24
### Added
- **Custom Tags (Tag Personalizzati):** Possibilità di etichettare i documenti.
    - **Tag Input:** Nuova interfaccia per aggiungere tag (es. "Lavoro", "Urgente") ai documenti.
    - **Colori Automatici:** I tag vengono colorati automaticamente in base al testo per una facile distinzione visiva.
    - **Filtro Avanzato:** Nuovo menu a tendina nell'Archivio per filtrare i documenti in base ai tag assegnati.
    - **Crittografia E2EE:** I tag sono salvati all'interno del payload cifrato, garantendo la privacy totale delle etichette.

## [0.14.0-beta] - 2025-02-24
### Added
- **Bulk Actions (Azioni di Massa):** Gestione avanzata dell'archivio.
    - **Selezione Multipla:** Checkbox interactive sulle card per selezionare più documenti contemporaneamente.
    - **Floating Action Bar:** Barra comandi contestuale che appare alla selezione, permettendo azioni rapide.
    - **Bulk Delete:** Eliminazione di più documenti in un solo click.
    - **Bulk Export:** Generazione di un unico file CSV riepilogativo contenente tutti i dati dei documenti selezionati.

## [0.13.0-beta] - 2025-02-24
### Added
- **Dark Mode (Modalità Scura):** Nuova interfaccia completa in modalità scura, ideale per l'uso notturno.
    - **Toggle UI:** Pulsante Sole/Luna nell'intestazione per cambiare modalità istantaneamente.
    - **Adattamento Totale:** Tutti i componenti (Dashboard, Archivio, Form, Chat, Modali) sono stati ridisegnati per garantire leggibilità ottimale sia su sfondo chiaro che scuro.
    - **Persistenza:** La preferenza viene salvata localmente per le visite future.

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
    - L'AI ha accesso visivo alle immagini del documento (Fronte/Retro) per rispondere a domande non standard (es. "Ci sono firme?", "Traduci le note").
    - Cronologia chat persistente per ogni sessione di lavoro.
    - **Supporto Archivio:** La chat funziona anche con i documenti caricati dall'archivio (senza immagini), utilizzando i dati estratti come contesto.

## [0.10.0-beta] - 2025-02-24
### Added
- **Smart Dashboard:** L'archivio cloud è stato completamente ridisegnato per includere informazioni vitali sullo stato del documento.
- **Expiration Monitor:** Nuova logica (`dateUtils`) che calcola i giorni rimanenti alla scadenza di ogni documento.
- **Visual Badges:** Le card dei documenti ora mostrano badge colorati:
    - 🔴 **Scaduto:** Il documento non è più valido.
    - 🟢 **Valido:** Il documento è in regola.
    - 🟡 **In Scadenza:** Mancano meno di 90 giorni.
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