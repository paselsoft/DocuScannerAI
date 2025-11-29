// Mappa dei mesi per il Codice Fiscale
const MONTH_MAP: { [key: string]: string } = {
  'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05', 'H': '06',
  'L': '07', 'M': '08', 'P': '09', 'R': '10', 'S': '11', 'T': '12'
};

interface DerivedData {
  data_nascita?: string;
  sesso?: string;
}

export const extractInfoFromFiscalCode = (cf: string | undefined): DerivedData => {
  if (!cf || cf.length !== 16) {
    return {};
  }

  const normalizedCF = cf.toUpperCase();
  
  // Estrazione caratteri rilevanti
  // Anno: 6-7, Mese: 8, Giorno+Sesso: 9-10
  const yearPart = normalizedCF.substring(6, 8);
  const monthChar = normalizedCF.substring(8, 9);
  const dayGenderPart = normalizedCF.substring(9, 11);

  // Validazione base caratteri numerici
  if (isNaN(Number(yearPart)) || isNaN(Number(dayGenderPart))) {
    return {};
  }

  // 1. Calcolo Sesso e Giorno
  let day = parseInt(dayGenderPart, 10);
  let sesso = 'M';

  if (day > 40) {
    sesso = 'F';
    day = day - 40;
  }

  // 2. Calcolo Mese
  const month = MONTH_MAP[monthChar];
  if (!month) return { sesso }; // Ritorniamo almeno il sesso se il mese è invalido

  // 3. Calcolo Anno
  // Logica euristica: se l'anno (es. 99) + 1900 è nel passato ragionevole, è 1999.
  // Se 24, è probabilmente 2024 (o 1924, ma assumiamo documenti attivi)
  const currentYearTwoDigits = new Date().getFullYear() % 100;
  let yearFull = 0;
  const yearTwoDigits = parseInt(yearPart, 10);

  // Soglia mobile: se l'anno estratto è minore o uguale all'anno corrente, assumiamo 20xx
  // Altrimenti 19xx. Es: nel 2025, '25' -> 2025, '26' -> 1926.
  if (yearTwoDigits <= currentYearTwoDigits) {
    yearFull = 2000 + yearTwoDigits;
  } else {
    yearFull = 1900 + yearTwoDigits;
  }

  // Formattazione Data GG/MM/AAAA
  const dayStr = day.toString().padStart(2, '0');
  const data_nascita = `${dayStr}/${month}/${yearFull}`;

  return {
    sesso,
    data_nascita
  };
};