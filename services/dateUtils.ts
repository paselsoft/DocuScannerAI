
export type ExpirationStatus = 'valid' | 'warning' | 'expired' | 'unknown';

export interface ExpirationInfo {
  status: ExpirationStatus;
  daysLeft: number;
  label: string;
  color: string;
  bgColor: string;
  progress: number; // 0-100
}

// Converte stringa GG/MM/AAAA in Date object
export const parseItalianDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mesi 0-11
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  return new Date(year, month, day);
};

export const getExpirationInfo = (dateStr: string | undefined): ExpirationInfo => {
  const expiryDate = parseItalianDate(dateStr);
  
  if (!expiryDate) {
    return {
      status: 'unknown',
      daysLeft: 0,
      label: 'N/A',
      color: 'text-slate-400',
      bgColor: 'bg-slate-100',
      progress: 0
    };
  }

  const today = new Date();
  // Resetta ore per confronto equo
  today.setHours(0, 0, 0, 0);
  
  // Calcola differenza in millisecondi
  const diffTime = expiryDate.getTime() - today.getTime();
  // Converti in giorni (arrotonda per eccesso)
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: 'expired',
      daysLeft,
      label: `Scaduto da ${Math.abs(daysLeft)} gg`,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      progress: 100 // Piena barra rossa
    };
  }

  // Soglia di attenzione: 90 giorni (3 mesi)
  if (daysLeft <= 90) {
    return {
      status: 'warning',
      daysLeft,
      label: `Scade tra ${daysLeft} gg`,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      progress: Math.max(10, 100 - (daysLeft / 90 * 100)) // La barra cresce man mano che si avvicina la scadenza
    };
  }

  return {
    status: 'valid',
    daysLeft,
    label: 'Valido',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    progress: 0
  };
};
