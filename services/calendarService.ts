import { parseItalianDate } from './dateUtils';
import { ExtractedData } from '../types';

export const generateIcsContent = (data: ExtractedData): string => {
  if (!data.data_scadenza) {
    throw new Error("Data di scadenza mancante.");
  }

  const expiryDate = parseItalianDate(data.data_scadenza);
  if (!expiryDate) {
    throw new Error("Formato data scadenza non valido.");
  }

  // Formato YYYYMMDD per eventi "Tutto il giorno"
  const dateString = expiryDate.toISOString().replace(/-/g, '').split('T')[0];
  const nowString = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const title = `Scadenza ${data.tipo_documento} - ${data.cognome} ${data.nome}`;
  const description = `Il documento ${data.tipo_documento} (N. ${data.numero_documento || 'N/D'}) scade il ${data.data_scadenza}. generato da DocuScanner AI.`;

  // Costruzione file ICS standard (RFC 5545)
  // Include due allarmi: 1 settimana prima e 1 giorno prima
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DocuScanner AI//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@docuscanner.app`,
    `DTSTAMP:${nowString}`,
    `DTSTART;VALUE=DATE:${dateString}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'TRIGGER:-P1W',
    'ACTION:DISPLAY',
    'DESCRIPTION:Il documento scade tra una settimana',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Il documento scade domani',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return icsLines.join('\r\n');
};

export const addToCalendar = (data: ExtractedData) => {
  try {
    const icsContent = generateIcsContent(data);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `scadenza_${data.cognome}_${data.tipo_documento.replace(/\s/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Errore generazione calendario:", error);
    throw error;
  }
};