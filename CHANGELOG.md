# Changelog

Tutti i cambiamenti notevoli a questo progetto saranno documentati in questo file.

## [0.2.1-beta] - 2025-02-24
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