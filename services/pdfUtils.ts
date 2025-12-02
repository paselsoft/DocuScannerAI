import * as pdfjsLib from 'pdfjs-dist';

// Configura il worker. Utilizziamo un CDN per evitare configurazioni complesse di build con Vite per i worker file.
// In produzione, sarebbe meglio servire il worker localmente.
// FIX: Usiamo .mjs per il worker per compatibilità con i moduli ES dinamici di PDF.js v5+
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const generatePdfThumbnail = async (file: File, scale: number = 1.5): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Carica il documento
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Ottieni la prima pagina
    const page = await pdf.getPage(1);

    // Imposta la scala in base al parametro ricevuto
    const viewport = page.getViewport({ scale: scale });

    // Prepara il canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) {
      throw new Error("Impossibile creare il contesto canvas");
    }

    // Renderizza la pagina sul canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // Use type assertion to any to resolve potential type mismatch with RenderParameters in newer pdfjs-dist versions
    await page.render(renderContext as any).promise;

    // Converti in stringa base64 (immagine)
    // Usiamo JPEG con qualità 0.8 per bilanciare qualità e peso
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error("Errore durante la generazione della thumbnail PDF:", error);
    throw error;
  }
};