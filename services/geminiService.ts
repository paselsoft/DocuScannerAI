import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractDataFromDocument = async (
  frontBase64: string, 
  frontMime: string,
  backBase64?: string,
  backMime?: string
): Promise<ExtractedData> => {
  if (!process.env.API_KEY) {
    throw new Error("Chiave API mancante. Impossibile contattare il servizio AI.");
  }

  try {
    const parts = [];

    // Aggiungi immagine fronte
    parts.push({
      inlineData: {
        mimeType: frontMime,
        data: frontBase64
      }
    });

    // Aggiungi immagine retro se presente
    if (backBase64 && backMime) {
      parts.push({
        inlineData: {
          mimeType: backMime,
          data: backBase64
        }
      });
    }

    // Aggiungi prompt
    parts.push({
      text: `Analizza i documenti forniti (Immagini o PDF) di un documento d'identità italiano. 
      Estrai i dati e classifica il documento in una delle seguenti categorie esatte:
      - "Carta d'Identità"
      - "Patente di Guida"
      - "Tessera Sanitaria"
      - "Passaporto"
      - "Altro"
      
      Regole di estrazione:
      - Cerca indirizzo e residenza anche sul retro se presente.
      - Cerca il numero identificativo del documento.
      - Cerca la Data di Scadenza (spesso indicata come 4b sulla patente).
      - Cerca la Data di Rilascio (spesso indicata come 4a sulla patente o "Rilasciata il" sulla Carta d'Identità).
      - Estrai il Sesso (M/F) se presente.
      - Se un campo non è leggibile o presente in nessuna delle immagini, lascia la stringa vuota.
      - Formatta tutte le date come GG/MM/AAAA.
      - Separa l'indirizzo dalla città.
      - Normalizza i testi (es. rimuovi "NATO A", "RESIDENTE IN").
      - Se l'immagine non è un documento valido, restituisci campi vuoti.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cognome: { type: Type.STRING, description: "Il cognome della persona" },
            nome: { type: Type.STRING, description: "Il nome della persona" },
            data_nascita: { type: Type.STRING, description: "Data di nascita in formato GG/MM/AAAA" },
            luogo_nascita: { type: Type.STRING, description: "Luogo o comune di nascita" },
            sesso: { type: Type.STRING, description: "Sesso (M o F)" },
            indirizzo_residenza: { type: Type.STRING, description: "Indirizzo di residenza (via e numero civico)" },
            citta_residenza: { type: Type.STRING, description: "Città o Comune di residenza" },
            codice_fiscale: { type: Type.STRING, description: "Codice Fiscale se presente" },
            numero_documento: { type: Type.STRING, description: "Numero del documento (es. CA00000AA per CI, U1V... per Patente)" },
            data_scadenza: { type: Type.STRING, description: "Data di scadenza del documento in formato GG/MM/AAAA" },
            data_rilascio: { type: Type.STRING, description: "Data di rilascio del documento (es. campo 4a patente) in formato GG/MM/AAAA" },
            tipo_documento: { type: Type.STRING, description: "Il tipo di documento: Carta d'Identità, Patente di Guida, Tessera Sanitaria, Passaporto, o Altro" }
          },
          required: ["cognome", "nome", "data_nascita", "luogo_nascita", "tipo_documento"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text) as ExtractedData;
      
      // Controllo base di validità
      if (!data.cognome && !data.nome && !data.tipo_documento) {
        throw new Error("Il documento non è stato riconosciuto o è illeggibile.");
      }
      
      return data;
    } else {
      throw new Error("Il servizio AI non ha restituito dati validi.");
    }
  } catch (error: any) {
    console.error("Errore durante l'estrazione dati:", error);
    if (error.message.includes("400") || error.message.includes("SAFETY")) {
       throw new Error("Immagine/File rifiutato per motivi di sicurezza o formato non valido.");
    }
    if (error.message.includes("fetch")) {
        throw new Error("Errore di connessione. Verifica la tua rete.");
    }
    throw error;
  }
};

export const askDocumentQuestion = async (
  question: string,
  history: ChatMessage[],
  images?: { 
    front?: { base64: string, mime: string }, 
    back?: { base64: string, mime: string } 
  },
  contextData?: ExtractedData | null
): Promise<string> => {
  try {
    const parts = [];

    // Context instructions setup based on available data
    if (images?.front) {
       // Scenario A: Abbiamo le immagini (Analisi Visiva)
       parts.push({
        text: `Sei un assistente esperto in analisi di documenti d'identità e amministrativi.
        Hai accesso alle immagini del documento (Fronte ed eventuale Retro) fornite qui sotto.
        Il tuo compito è rispondere alle domande dell'utente basandoti ESCLUSIVAMENTE su ciò che vedi nelle immagini.
        
        Se l'informazione non è presente o è illeggibile, dillo chiaramente. Non inventare dati.
        Sii conciso e diretto.`
      });

      // Images
      parts.push({
        inlineData: {
          mimeType: images.front.mime,
          data: images.front.base64
        }
      });

      if (images.back) {
        parts.push({
          inlineData: {
            mimeType: images.back.mime,
            data: images.back.base64
          }
        });
      }
    } else if (contextData) {
       // Scenario B: Non abbiamo le immagini, ma abbiamo i dati estratti (Analisi Testuale/Archivio)
       parts.push({
         text: `Sei un assistente esperto in analisi di documenti.
         NON hai accesso alle immagini originali del documento, ma hai accesso ai dati strutturati estratti in precedenza (JSON).
         
         Dati Documento:
         ${JSON.stringify(contextData, null, 2)}
         
         Rispondi alle domande dell'utente basandoti su questi dati. Se l'informazione non è presente nei dati JSON, rispondi che non è disponibile nell'archivio.
         Sii conciso e utile.`
       });
    } else {
       return "Non ho dati sufficienti (immagini o dati estratti) per rispondere.";
    }

    // History Context
    if (history.length > 0) {
      const historyText = history.map(msg => 
        `${msg.role === 'user' ? 'Utente' : 'AI'}: ${msg.text}`
      ).join('\n');
      
      parts.push({
        text: `Cronologia della conversazione:\n${historyText}`
      });
    }

    // Current Question
    parts.push({
      text: `Domanda Utente: ${question}`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: parts
      }
    });

    return response.text || "Non sono riuscito a generare una risposta.";

  } catch (error: any) {
    console.error("Errore chat documento:", error);
    throw new Error("Impossibile contattare l'assistente AI.");
  }
};

// Nuova interfaccia per la geometria
export interface DocumentGeometry {
  rotation: number; // Gradi
  box: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  }
}

export const analyzeDocumentGeometry = async (base64Image: string): Promise<DocumentGeometry> => {
  if (!process.env.API_KEY) throw new Error("API Key mancante");

  try {
    // Usiamo flash-lite per velocità, dato che è un task geometrico semplice
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analizza questa immagine. Il tuo compito è identificare il documento principale (carta d'identità, patente, foglio, etc.).
            Restituisci un JSON con due informazioni:
            1. "rotation": L'angolo in gradi (positivo o negativo, tra -180 e 180) necessario per ruotare l'immagine affinché il testo del documento sia perfettamente orizzontale e dritto.
            2. "box": Le coordinate del bounding box che racchiude il documento, espresse in valori percentuali da 0 a 100 (ymin, xmin, ymax, xmax).
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rotation: { type: Type.NUMBER, description: "Angolo di rotazione in gradi" },
            box: {
              type: Type.OBJECT,
              properties: {
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER }
              },
              required: ["ymin", "xmin", "ymax", "xmax"]
            }
          },
          required: ["rotation", "box"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    if (result.rotation === undefined || !result.box) {
      throw new Error("Dati geometrici non validi");
    }

    return result as DocumentGeometry;

  } catch (error) {
    console.error("Errore analisi geometrica:", error);
    throw new Error("Impossibile rilevare automaticamente il documento.");
  }
};