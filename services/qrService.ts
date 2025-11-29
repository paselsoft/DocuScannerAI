import jsQR from "jsqr";

// Regex per il Codice Fiscale Italiano
// 6 lettere, 2 numeri, 1 lettera, 2 numeri, 1 lettera, 3 numeri, 1 lettera
const CF_REGEX = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;

export interface QrResult {
  text: string;
  isFiscalCode: boolean;
}

export const scanQrCodeFromImage = (file: File): Promise<QrResult | null> => {
  return new Promise((resolve, reject) => {
    // 1. I PDF non sono supportati direttamente da jsQR (andrebbero renderizzati prima)
    // Per ora saltiamo i PDF e processiamo solo immagini.
    if (file.type === 'application/pdf') {
        resolve(null);
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        // 2. Creiamo un canvas offscreen per leggere i pixel
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (!context) {
          resolve(null);
          return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);

        // 3. Otteniamo i dati dell'immagine
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // 4. Scansioniamo con jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          // Controlliamo se è un codice fiscale
          const cleanText = code.data.trim().toUpperCase();
          // Alcuni QR contengono URL o dati extra, proviamo a estrarre il CF se presente in una stringa più lunga
          // Ma per le CIE solitamente è solo il codice o un URL param
          
          const isCF = CF_REGEX.test(cleanText);
          
          resolve({
            text: code.data,
            isFiscalCode: isCF
          });
        } else {
          resolve(null);
        }
      };
      
      image.onerror = () => resolve(null);
      
      if (typeof event.target?.result === 'string') {
          image.src = event.target.result;
      } else {
          resolve(null);
      }
    };
    
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};