import { ExtractedData } from "../types";

export const exportToCsv = (data: ExtractedData) => {
  // Definizione colonne
  const headers = [
    "Cognome", 
    "Nome", 
    "Sesso",
    "Data Nascita", 
    "Luogo Nascita", 
    "Codice Fiscale", 
    "Tipo Documento", 
    "Numero Documento", 
    "Data Scadenza", 
    "Data Rilascio", 
    "Indirizzo", 
    "Città"
  ];

  // Preparazione riga dati
  const row = [
    data.cognome,
    data.nome,
    data.sesso,
    data.data_nascita,
    data.luogo_nascita,
    data.codice_fiscale,
    data.tipo_documento,
    data.numero_documento,
    data.data_scadenza,
    data.data_rilascio,
    data.indirizzo_residenza,
    data.citta_residenza
  ].map(field => {
    // Escape dei campi per il CSV (gestione virgole e quote)
    const stringField = String(field || '');
    if (stringField.includes(',') || stringField.includes('"')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  });

  // Costruzione contenuto CSV
  const csvContent = [
    headers.join(','),
    row.join(',')
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Export_${data.cognome || 'Documento'}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};