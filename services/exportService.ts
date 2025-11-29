
import { ExtractedData } from "../types";

const getCsvContent = (data: ExtractedData): string => {
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
    const stringField = String(field || '');
    if (stringField.includes(',') || stringField.includes('"')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  });

  return [
    headers.join(','),
    row.join(',')
  ].join('\n');
};

export const exportToCsv = (data: ExtractedData) => {
  const csvContent = getCsvContent(data);

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

// Genera un oggetto File per la condivisione nativa (Web Share API)
export const generateCsvFile = (data: ExtractedData): File => {
    const csvContent = getCsvContent(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `Export_${data.cognome || 'Documento'}.csv`;
    return new File([blob], fileName, { type: 'text/csv' });
};
