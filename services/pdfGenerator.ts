import { jsPDF } from "jspdf";
import { ExtractedData } from "../types";

export const generateLegalizationPdf = (data: ExtractedData) => {
  const doc = new jsPDF();

  // Font setup
  doc.setFont("times", "normal");

  // --- Intestazione ---
  // Ripristinato layout senza logo per stabilità
  doc.setFontSize(12);
  doc.text("Ministero delle Infrastrutture e dei Trasporti", 105, 20, { align: "center" });
  doc.text("Direzione Generale Territoriale del Centro", 105, 26, { align: "center" });
  doc.text("Ufficio Motorizzazione Civile di Firenze", 105, 32, { align: "center" });
  doc.text("Sezione Coordinata di Siena", 105, 38, { align: "center" });

  // --- Titolo ---
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("LEGALIZZAZIONE DI FOTOGRAFIA", 105, 55, { align: "center" });
  
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("(art. 34, comma 1, D.P.R. 28.12.2000 n. 445)", 105, 62, { align: "center" });

  // --- Box Foto ---
  doc.setLineWidth(0.2);
  doc.rect(130, 80, 40, 50); // x, y, w, h
  doc.setFontSize(8);
  doc.text("FOTO", 150, 105, { align: "center" });

  // --- Dati Anagrafici ---
  doc.setFontSize(12);
  
  // Riga 1: Si legalizza la foto di
  doc.text("Si legalizza la foto di :", 20, 90);

  // Riga 2: Cognome e Nome
  // Cognome
  const cognome = data.cognome || "";
  doc.setFont("times", "bold");
  doc.text(cognome, 40, 105);
  doc.line(20, 106, 100, 106); // Sottolineatura
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("(Cognome)", 60, 110, { align: "center" });

  // Nome
  doc.setFontSize(12);
  const nome = data.nome || "";
  doc.setFont("times", "bold");
  doc.text(nome, 110, 105);
  doc.line(105, 106, 180, 106); // Sottolineatura
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("(Nome)", 142, 110, { align: "center" });

  // Riga 3: Nato a ... il ...
  doc.setFontSize(12);
  doc.text("nato/a a", 20, 125);
  
  // Luogo
  const luogo = data.luogo_nascita || "";
  doc.setFont("times", "bold");
  doc.text(luogo, 40, 125);
  doc.line(35, 126, 130, 126); // Sottolineatura

  doc.setFont("times", "normal");
  doc.text("il", 135, 125);

  // Data Nascita
  const dataNascita = data.data_nascita || "";
  doc.setFont("times", "bold");
  doc.text(dataNascita, 142, 125);
  doc.line(140, 126, 180, 126); // Sottolineatura

  // --- Identificazione ---
  doc.setFont("times", "normal");
  doc.text("L'identità è stata accertata tramite esibizione del seguente documento:", 20, 145);

  // Checkbox
  const isCI = data.tipo_documento === "Carta d'Identità";
  const isPatente = data.tipo_documento === "Patente di Guida";
  const isPass = data.tipo_documento === "Passaporto";
  const isAltro = !isCI && !isPatente && !isPass && data.tipo_documento;

  const checkboxY = 155;
  
  // C.I.
  doc.rect(20, checkboxY - 4, 4, 4);
  if (isCI) doc.text("X", 20.5, checkboxY - 0.5);
  doc.text("C.I.", 26, checkboxY);

  // C.I.E.
  doc.rect(45, checkboxY - 4, 4, 4);
  doc.text("C.I.E.", 51, checkboxY);

  // PATENTE
  doc.rect(75, checkboxY - 4, 4, 4);
  if (isPatente) doc.text("X", 75.5, checkboxY - 0.5);
  doc.text("PATENTE", 81, checkboxY);

  // PASSAPORTO
  doc.rect(110, checkboxY - 4, 4, 4);
  if (isPass) doc.text("X", 110.5, checkboxY - 0.5);
  doc.text("PASSAPORTO", 116, checkboxY);

  // ALTRO
  doc.rect(150, checkboxY - 4, 4, 4);
  if (isAltro) doc.text("X", 150.5, checkboxY - 0.5);
  doc.text("ALTRO", 156, checkboxY);
  
  // Numero Documento
  doc.text("n.", 20, 170);
  const numDoc = data.numero_documento || "";
  doc.setFont("times", "bold");
  doc.text(numDoc, 30, 170);
  doc.line(25, 171, 180, 171); // Sottolineatura

  // Rilasciato da... il...
  doc.setFont("times", "normal");
  doc.text("rilasciato da", 20, 185);
  
  // Ente rilascio
  let ente = "";
  if (isPatente) ente = "U.C.O. / M.C.T.C.";
  if (isCI) ente = `Comune di ${data.citta_residenza || "..."}`;

  doc.text(ente, 50, 185);
  doc.line(45, 186, 140, 186); // Sottolineatura

  doc.text("il", 145, 185);
  // Data Rilascio
  const dataRilascio = data.data_rilascio || "";
  doc.setFont("times", "bold");
  doc.text(dataRilascio, 150, 185);
  doc.line(150, 186, 180, 186); // Sottolineatura

  // --- Footer Legale ---
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Esente da imposta di bollo ai sensi dell'art. 34, comma 2, del D.P.R. 28 dicembre 2000, n. 445.", 20, 205);

  // --- Data e Firma ---
  doc.setFontSize(12);
  const today = new Date().toLocaleDateString('it-IT');
  doc.text(`Siena, Lì ${today}`, 20, 230);
  doc.line(35, 231, 80, 231);

  doc.text("L'incaricato del servizio", 130, 245, { align: "center" });
  doc.line(100, 260, 160, 260);

  // Save
  doc.save(`Legalizzazione_${data.cognome || 'Foto'}.pdf`);
};

export const generateDataSheetPdf = (data: ExtractedData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // --- Colori e Font ---
  const primaryColor = '#2563eb'; // Blue 600
  const secondaryColor = '#475569'; // Slate 600
  const lightBg = '#f1f5f9'; // Slate 100

  // --- Header ---
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Scheda Dati Documento", 20, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generato da DocuScanner AI - ${new Date().toLocaleDateString('it-IT')}`, 20, 26);

  let y = 50;

  // Helper per sezioni
  const addSectionTitle = (title: string, yPos: number) => {
      doc.setFillColor(lightBg);
      doc.rect(20, yPos - 6, pageWidth - 40, 10, 'F');
      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title.toUpperCase(), 22, yPos);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 6, pageWidth - 20, yPos + 6);
      return yPos + 15;
  };

  // Helper per campi
  const addField = (label: string, value: string | undefined, xPos: number, yPos: number, fullWidth = false) => {
      doc.setTextColor(secondaryColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(label.toUpperCase(), xPos, yPos);
      
      doc.setTextColor('#000000');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const textVal = value || '-';
      doc.text(textVal, xPos, yPos + 6);

      // Linea sottile sotto il campo
      doc.setDrawColor(230, 230, 230);
      const lineWidth = fullWidth ? pageWidth - 40 : (pageWidth - 50) / 2;
      doc.line(xPos, yPos + 9, xPos + lineWidth, yPos + 9);
  };

  // --- Sezione 1: Dati Personali ---
  y = addSectionTitle("Dati Personali", y);
  
  addField("Cognome", data.cognome, 20, y);
  addField("Nome", data.nome, 110, y);
  y += 20;

  addField("Sesso", data.sesso, 20, y);
  addField("Codice Fiscale", data.codice_fiscale, 110, y);
  y += 20;

  addField("Data di Nascita", data.data_nascita, 20, y);
  addField("Luogo di Nascita", data.luogo_nascita, 110, y);
  y += 25;

  // --- Sezione 2: Dati Documento ---
  y = addSectionTitle("Dettagli Documento", y);

  addField("Tipo Documento", data.tipo_documento, 20, y);
  addField("Numero Documento", data.numero_documento, 110, y);
  y += 20;

  addField("Data Rilascio", data.data_rilascio, 20, y);
  addField("Data Scadenza", data.data_scadenza, 110, y);
  y += 25;

  // --- Sezione 3: Residenza ---
  y = addSectionTitle("Residenza", y);

  addField("Indirizzo", data.indirizzo_residenza, 20, y, true);
  y += 20;
  addField("Città", data.citta_residenza, 20, y, true);
  y += 25;

  // --- Sezione 4: Tag & Note (Se presenti) ---
  if (data.tags && data.tags.length > 0) {
      y = addSectionTitle("Etichette", y);
      doc.setTextColor('#000000');
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(data.tags.join(', '), 20, y);
      y += 20;
  }

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
  
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor);
  doc.text("Documento generato automaticamente. Verificare i dati prima dell'uso.", 20, pageHeight - 12);
  doc.text("DocuScanner AI", pageWidth - 20, pageHeight - 12, { align: 'right' });

  doc.save(`Scheda_${data.cognome || 'Documento'}.pdf`);
};