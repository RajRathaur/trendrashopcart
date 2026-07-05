import jsPDF from 'jspdf';

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
// spacing ~ every 1cm (10mm)
function drawWatermark(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  // @ts-expect-error - GState typing
  doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const text = 'trendra.store';
  const stepX = 10; // 1cm horizontal
  const stepY = 10; // 1cm vertical
  for (let x = 0; x <= pageW + stepX; x += stepX) {
    for (let y = 0; y <= pageH + stepY; y += stepY) {
      doc.text(text, x, y, { angle: 90 });
    }
  }
  doc.restoreGraphicsState();
  doc.setTextColor(0, 0, 0);
}

export function generateTaxInvoice(data: InvoiceData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Watermark first (behind content)
  drawWatermark(doc);

  // Header
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

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 38, pageW - 15, 38);

  // Seller / Buyer blocks
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

  // Items table
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

  // Totals — GST 18% inclusive breakdown
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

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('This is a computer-generated invoice. For support: support@trendra.store', pageW / 2, pageH - 10, { align: 'center' });

  doc.save(`Invoice-${data.order_number}.pdf`);
}
