import jsPDF from "jspdf";

import type { AnalysisResponse, HistoryItem } from "../types";

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return lines.length * lineHeight;
}

export function downloadReport(response: AnalysisResponse, title = "Symptom Report") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let cursorY = margin;

  doc.setFontSize(18);
  doc.setTextColor(28, 64, 52); 
  doc.text(title, margin, cursorY);

  cursorY += 26;

  if (response.criticalWarning) {
    doc.setFillColor(255, 230, 179); 
    doc.rect(margin, cursorY - 8, doc.internal.pageSize.getWidth() - margin * 2, 40, "F");
    doc.setFontSize(11);
    doc.setTextColor(120, 64, 0);
    const used = addWrappedText(doc, response.criticalWarning, margin + 8, cursorY + 4, doc.internal.pageSize.getWidth() - margin * 2 - 16, 14);
    cursorY += used + 18;
  }

  doc.setFontSize(14);
  doc.setTextColor(6, 95, 70);
  doc.text("Summary", margin, cursorY);
  cursorY += 18;
  doc.setFontSize(11);
  doc.setTextColor(34, 50, 58);
  cursorY += addWrappedText(doc, response.summary, margin, cursorY, doc.internal.pageSize.getWidth() - margin * 2, 14);

  cursorY += 12;
  doc.setFontSize(13);
  doc.setTextColor(6, 95, 70);
  doc.text("Possible Conditions", margin, cursorY);
  cursorY += 16;

  doc.setFontSize(11);
  response.possibleConditions.forEach((c, idx) => {
    doc.setTextColor(0, 0, 0);
    doc.text(`${idx + 1}. ${c.name} (${c.confidence})`, margin, cursorY);
    cursorY += 14;
    cursorY += addWrappedText(doc, c.reasoning, margin + 12, cursorY, doc.internal.pageSize.getWidth() - margin * 2 - 12, 12);
    cursorY += 8;
    if (cursorY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
  });

  if (response.differentiatingSymptoms?.length) {
    doc.setFontSize(13);
    doc.setTextColor(6, 95, 70);
    doc.text("Differentiating Symptoms", margin, cursorY);
    cursorY += 16;

    doc.setFontSize(11);
    response.differentiatingSymptoms.forEach((g) => {
      doc.text(`${g.condition}:`, margin, cursorY);
      cursorY += 14;
      doc.text(g.symptomsToCheck.join(", "), margin + 12, cursorY);
      cursorY += 16;
      if (cursorY > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
    });
  }

  if (response.nextSteps?.length) {
    doc.setFontSize(13);
    doc.setTextColor(6, 95, 70);
    doc.text("Recommended Next Steps", margin, cursorY);
    cursorY += 16;
    doc.setFontSize(11);
    response.nextSteps.forEach((step, i) => {
      cursorY += addWrappedText(doc, `${i + 1}. ${step}`, margin, cursorY, doc.internal.pageSize.getWidth() - margin * 2, 14);
      cursorY += 8;
      if (cursorY > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
    });
  }

  doc.setProperties({ title });
  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export function downloadCumulative(history: HistoryItem[], title = "Cumulative_Symptom_Reports") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 36;
  let cursorY = margin;

  doc.setFontSize(18);
  doc.setTextColor(6, 95, 70);
  doc.text("Cumulative Symptom Reports", margin, cursorY);
  cursorY += 26;

  history.forEach((h, idx) => {
    doc.setFontSize(12);
    doc.setTextColor(10, 60, 40);
    doc.text(`${idx + 1}. Query: ${h.symptoms}`, margin, cursorY);
    cursorY += 16;

    doc.setFontSize(11);
    cursorY += addWrappedText(doc, `Summary: ${h.response.summary}`, margin + 8, cursorY, doc.internal.pageSize.getWidth() - margin * 2 - 8, 14);

    cursorY += 8;
    if (h.response.possibleConditions?.length) {
      h.response.possibleConditions.forEach((c) => {
        doc.text(`- ${c.name} (${c.confidence})`, margin + 12, cursorY);
        cursorY += 13;
        cursorY += addWrappedText(doc, c.reasoning, margin + 18, cursorY, doc.internal.pageSize.getWidth() - margin * 2 - 18, 12);
        cursorY += 6;
      });
    }

    if (h.response.criticalWarning) {
      doc.setTextColor(150, 60, 10);
      cursorY += addWrappedText(doc, `⚠️ ${h.response.criticalWarning}`, margin + 8, cursorY, doc.internal.pageSize.getWidth() - margin * 2 - 8, 14);
      doc.setTextColor(10, 60, 40);
      cursorY += 6;
    }

    cursorY += 12;
    if (cursorY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
  });

  doc.setProperties({ title });
  doc.save(`${title}.pdf`);
}
