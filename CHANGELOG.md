# Changelog

Tutti i cambiamenti notevoli a questo progetto saranno documentati in questo file.

## [0.1.0] - 2024-05-22
### Added
- **Core:** Integrazione con Google Gemini 2.0 Flash per l'estrazione OCR intelligente.
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
