import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface InvoiceItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
}

export interface InvoiceData {
  order_number: string;
  order_date: string;
  customer_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  payment_method: string;
  seller_name: string;
  seller_gstin?: string | null;
  seller_address?: string | null;
  items: InvoiceItem[];
}

// Draws "trendra.store" watermark rotated 90° repeated across the entire page
function drawWatermark(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  // @ts-ignore - GState typing
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.08 }));
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const text = 'trendra.store';
  const stepX = 10;
  const stepY = 10;
  for (let x = 0; x <= pageW + stepX; x += stepX) {
    for (let y = 0; y <= pageH + stepY; y += stepY) {
      doc.text(text, x, y, { angle: 90 });
    }
  }
  doc.restoreGraphicsState();
  doc.setTextColor(0, 0, 0);
}

// Simple pseudo-barcode from a string (visual only, not scannable spec)
function drawBarcode(doc: jsPDF, text: string, x: number, y: number, w: number, h: number) {
  doc.setFillColor(0, 0, 0);
  let cursor = x;
  const chars = text.split('');
  const total = chars.reduce((s, c) => s + (c.charCodeAt(0) % 5) + 2, 0);
  const unit = w / total;
  chars.forEach((c, i) => {
    const bw = ((c.charCodeAt(0) % 5) + 2) * unit;
    if (i % 2 === 0) doc.rect(cursor, y, bw * 0.6, h, 'F');
    cursor += bw;
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(text, x + w / 2, y + h + 3.5, { align: 'center' });
}

async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 256, errorCorrectionLevel: 'M' });
}

function drawShippingLabel(doc: jsPDF, data: InvoiceData, qrDataUrl: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  drawWatermark(doc);

  const isCod = /cod/i.test(data.payment_method);
  const marginX = 12;
  const boxW = pageW - marginX * 2;

  // Outer border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(marginX, 12, boxW, pageH - 24);

  // Top: brand + payment mode
  doc.setFillColor(41, 121, 255);
  doc.rect(marginX, 12, boxW, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Trendra', marginX + 3, 20);
  doc.setFontSize(9);
  doc.text('trendra.store', marginX + 30, 20);

  doc.setFillColor(isCod ? 234 : 22, isCod ? 88 : 163, isCod ? 12 : 74);
  doc.rect(pageW - marginX - 40, 12, 40, 12, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(isCod ? 'COD' : 'PREPAID', pageW - marginX - 20, 20, { align: 'center' });

  // Deliver To
  let y = 30;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DELIVER TO / परितारित को:', marginX + 3, y);
  y += 6;
  doc.setFontSize(13);
  doc.text(data.customer_name, marginX + 3, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const addrLines = doc.splitTextToSize(data.shipping_address, boxW - 6);
  addrLines.forEach((line: string) => { doc.text(line, marginX + 3, y); y += 5.5; });
  doc.text(`${data.shipping_city}, ${data.shipping_state}`, marginX + 3, y); y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`PIN: ${data.shipping_pincode}`, marginX + 3, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Phone: ${data.shipping_phone}`, marginX + 3, y); y += 8;

  // Divider
  doc.setDrawColor(0, 0, 0);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  // From (seller)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FROM / प्रेषक:', marginX + 3, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(data.seller_name, marginX + 3, y); y += 4.5;
  if (data.seller_address) {
    const sLines = doc.splitTextToSize(data.seller_address, boxW - 6);
    sLines.forEach((line: string) => { doc.text(line, marginX + 3, y); y += 4.5; });
  }
  if (data.seller_gstin) { doc.text(`GSTIN: ${data.seller_gstin}`, marginX + 3, y); y += 5; }
  y += 3;

  // Divider
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  // Order info + barcode + tracking QR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Order #: ${data.order_number}`, marginX + 3, y);
  doc.text(`Date: ${new Date(data.order_date).toLocaleDateString('en-IN')}`, pageW - marginX - 3, y, { align: 'right' });
  y += 3;
  const qrSize = 28;
  const barcodeW = boxW - 6 - qrSize - 6;
  drawBarcode(doc, data.order_number, marginX + 3, y, barcodeW, 12);
  // QR (right)
  const qrX = pageW - marginX - qrSize - 3;
  doc.addImage(qrDataUrl, 'PNG', qrX, y - 2, qrSize, qrSize);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Scan to track', qrX + qrSize / 2, y + qrSize + 1, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += qrSize + 2;

  // Divider
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  // Product summary table
  doc.setFillColor(240, 240, 240);
  doc.rect(marginX, y - 4, boxW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Product', marginX + 3, y);
  doc.text('SKU/Variant', pageW / 2 - 10, y);
  doc.text('Qty', pageW - marginX - 25, y, { align: 'right' });
  doc.text('Amt', pageW - marginX - 3, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  let total = 0;
  data.items.forEach((it) => {
    const amt = it.price * it.quantity;
    total += amt;
    const name = it.product_name.length > 40 ? it.product_name.slice(0, 40) + '…' : it.product_name;
    doc.text(name, marginX + 3, y);
    const variant = [it.size && `Sz: ${it.size}`, it.color && `Col: ${it.color}`].filter(Boolean).join(' / ') || '—';
    doc.text(variant, pageW / 2 - 10, y);
    doc.text(String(it.quantity), pageW - marginX - 25, y, { align: 'right' });
    doc.text(`Rs.${amt.toFixed(0)}`, pageW - marginX - 3, y, { align: 'right' });
    y += 5;
  });

  y += 2;
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isCod ? 'COLLECT ON DELIVERY' : 'PREPAID — DO NOT COLLECT', marginX + 3, y);
  doc.text(`Rs. ${total.toFixed(2)}`, pageW - marginX - 3, y, { align: 'right' });

  // Cut-here line near bottom
  const cutY = pageH - 18;
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setDrawColor(150, 150, 150);
  doc.line(marginX, cutY, pageW - marginX, cutY);
  doc.setLineDashPattern([], 0);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('✂  Cut here — Tax Invoice on next page', pageW / 2, cutY - 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

export function generateTaxInvoice(data: InvoiceData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Page 1: Shipping label
  drawShippingLabel(doc, data);

  // Page 2: Tax Invoice
  doc.addPage();
  drawWatermark(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(41, 121, 255);
  doc.text('Trendra', 15, 20);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('trendra.store', 15, 26);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('TAX INVOICE', pageW - 15, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Invoice #: ${data.order_number}`, pageW - 15, 27, { align: 'right' });
  doc.text(`Date: ${new Date(data.order_date).toLocaleDateString('en-IN')}`, pageW - 15, 32, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 38, pageW - 15, 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Sold By:', 15, 46);
  doc.text('Bill To:', pageW / 2 + 5, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const sellerLines = [
    data.seller_name,
    data.seller_address || '',
    data.seller_gstin ? `GSTIN: ${data.seller_gstin}` : '',
  ].filter(Boolean);
  sellerLines.forEach((line, i) => doc.text(line, 15, 52 + i * 5));

  const buyerLines = [
    data.customer_name,
    data.shipping_address,
    `${data.shipping_city}, ${data.shipping_state} - ${data.shipping_pincode}`,
    `Phone: ${data.shipping_phone}`,
  ];
  buyerLines.forEach((line, i) => doc.text(line, pageW / 2 + 5, 52 + i * 5));

  let y = 88;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, pageW - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', 17, y);
  doc.text('Item', 25, y);
  doc.text('Qty', 120, y, { align: 'right' });
  doc.text('Price', 145, y, { align: 'right' });
  doc.text('Amount', pageW - 17, y, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  let subtotal = 0;
  data.items.forEach((item, idx) => {
    const amt = item.price * item.quantity;
    subtotal += amt;
    const name = item.product_name.length > 45 ? item.product_name.slice(0, 45) + '…' : item.product_name;
    doc.text(String(idx + 1), 17, y);
    doc.text(name, 25, y);
    if (item.size || item.color) {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text([item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join('  '), 25, y + 4);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
    }
    doc.text(String(item.quantity), 120, y, { align: 'right' });
    doc.text(`Rs. ${item.price.toFixed(2)}`, 145, y, { align: 'right' });
    doc.text(`Rs. ${amt.toFixed(2)}`, pageW - 17, y, { align: 'right' });
    y += item.size || item.color ? 10 : 7;
  });

  const taxable = subtotal / 1.18;
  const gst = subtotal - taxable;
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(pageW / 2, y, pageW - 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Taxable Value:', pageW / 2 + 5, y);
  doc.text(`Rs. ${taxable.toFixed(2)}`, pageW - 17, y, { align: 'right' });
  y += 5;
  doc.text('GST (18%):', pageW / 2 + 5, y);
  doc.text(`Rs. ${gst.toFixed(2)}`, pageW - 17, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', pageW / 2 + 5, y);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, pageW - 17, y, { align: 'right' });
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Payment Method: ${data.payment_method}`, 15, y);

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('This is a computer-generated invoice. For support: support@trendra.store', pageW / 2, pageH - 10, { align: 'center' });

  doc.save(`Trendra-${data.order_number}.pdf`);
}
