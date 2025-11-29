import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

// Regex per il Codice Fiscale Italiano
// 6 lettere, 2 numeri, 1 lettera, 2 numeri, 1 lettera, 3 numeri, 1 lettera
const CF_REGEX = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;

export interface QrResult {
  text: string;
  isFiscalCode: boolean;
}

// Istanziamo il reader una sola volta per efficienza
const codeReader = new BrowserMultiFormatReader();

export const scanQrCodeFromImage = (file: File): Promise<QrResult | null> => {
  return new Promise(async (resolve, reject) => {
    // 1. I PDF non sono supportati direttamente (andrebbero renderizzati prima)
    if (file.type === 'application/pdf') {
        resolve(null);
        return;
    }

    // Creiamo un URL temporaneo per l'immagine
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = imageUrl;

    // Attendiamo il caricamento dell'immagine per sicurezza
    await new Promise((r) => { img.onload = r; });

    try {
        // 2. Usiamo ZXing per decodificare qualsiasi formato (QR, Code 128, Code 39, ecc.)
        // decodeFromImageElement è più robusto di decodeFromImageUrl per immagini locali
        const result = await codeReader.decodeFromImageElement(img);
        
        if (result) {
            const text = result.getText();
            const cleanText = text.trim().toUpperCase();
            
            // Verifica se è un codice fiscale valido
            const isCF = CF_REGEX.test(cleanText);

            resolve({
                text: cleanText,
                isFiscalCode: isCF
            });
        } else {
            resolve(null);
        }
    } catch (err) {
        // ZXing lancia un'eccezione se non trova codici, è un comportamento normale
        if (err instanceof NotFoundException) {
            // Nessun codice trovato
            resolve(null);
        } else {
            console.warn("Errore durante la scansione barcode:", err);
            resolve(null);
        }
    } finally {
        // Pulizia memoria
        URL.revokeObjectURL(imageUrl);
    }
  });
};