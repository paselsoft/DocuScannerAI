import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

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

    if (response.text) {
      const data = JSON.parse(response.text) as ExtractedData;
      
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