import { jsPDF } from "jspdf";
import { CHALLENGE_LOGO_BASE64 } from "./logoBase64";

export type ReceiptLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type ReceiptData = {
  date: string; // YYYY-MM-DD
  lines: ReceiptLine[];
  total: number;
  paymentMethod: string;
  customerName?: string;
};

const STORE_ADDRESS = "Amenábar 1024, Colegiales, CABA";
const STORE_WHATSAPP = "+54 9 11 3795-2557";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(
    value
  );

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Colores de marca (RGB, jsPDF no soporta variables CSS)
const PLUM: [number, number, number] = [59, 23, 48];
const CORAL: [number, number, number] = [255, 106, 77];
const INK: [number, number, number] = [36, 19, 34];
const CREAM: [number, number, number] = [247, 241, 234];

export function generateReceiptPdf(data: ReceiptData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 18;

  // --- Encabezado ---
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageWidth, 34, "F");

  // Logo (emblema circular del zorro), tamaño fijo, alineado a la izquierda
  const logoSize = 20;
  doc.addImage(CHALLENGE_LOGO_BASE64, "PNG", marginX, 7, logoSize, logoSize * (625 / 618));

  const textX = marginX + logoSize + 6;

  doc.setTextColor(...PLUM);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHALLENGE", textX, y - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  y += 5;
  doc.text("Comprobante de venta", textX, y);

  doc.setFontSize(8);
  doc.setTextColor(90, 80, 88);
  y += 6;
  doc.text(STORE_ADDRESS, textX, y);
  y += 4.5;
  doc.text(`WhatsApp: ${STORE_WHATSAPP}`, textX, y);

  y = 42;

  // --- Datos de la venta ---
  doc.setTextColor(...INK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Fecha: ${formatDate(data.date)}`, marginX, y);
  if (data.customerName) {
    doc.text(`Cliente: ${data.customerName}`, pageWidth - marginX, y, { align: "right" });
  }
  y += 8;

  // --- Tabla de items ---
  doc.setDrawColor(...PLUM);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Producto", marginX, y);
  doc.text("Cant.", pageWidth - marginX - 38, y, { align: "right" });
  doc.text("P. unit.", pageWidth - marginX - 18, y, { align: "right" });
  doc.text("Subtotal", pageWidth - marginX, y, { align: "right" });
  y += 4;
  doc.setDrawColor(220, 210, 216);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const line of data.lines) {
    // envuelve el nombre si es muy largo
    const nameLines = doc.splitTextToSize(line.name, pageWidth - marginX * 2 - 60);
    doc.text(nameLines, marginX, y);
    doc.text(String(line.quantity), pageWidth - marginX - 38, y, { align: "right" });
    doc.text(formatARS(line.unitPrice), pageWidth - marginX - 18, y, { align: "right" });
    doc.text(formatARS(line.total), pageWidth - marginX, y, { align: "right" });
    y += 5 * nameLines.length + 2;
  }

  y += 2;
  doc.setDrawColor(...PLUM);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // --- Total ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PLUM);
  doc.text("TOTAL", marginX, y);
  doc.text(formatARS(data.total), pageWidth - marginX, y, { align: "right" });
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Forma de pago: ${data.paymentMethod}`, marginX, y);
  y += 12;

  // --- Aviso: no es factura oficial ---
  doc.setFillColor(...CORAL);
  const noticeHeight = 12;
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, noticeHeight, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Este comprobante es un resumen interno y NO es una factura oficial de AFIP.", pageWidth / 2, y + 7.5, {
    align: "center",
  });

  // --- Pie ---
  doc.setTextColor(140, 130, 136);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("¡Gracias por tu compra!", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
    align: "center",
  });

  return doc;
}

export function downloadReceiptPdf(data: ReceiptData): string {
  const doc = generateReceiptPdf(data);
  const fileName = `comprobante-challenge-${data.date}-${Date.now()}.pdf`;
  doc.save(fileName);
  return fileName;
}
