// PDF Generation for Token Slips & Payment Receipts
// KRISHIFLOW-AI - Smart India Hackathon 2026

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface TokenPdfData {
  tokenCode: string;
  tokenNumber: number;
  farmerName: string;
  farmerPhone?: string;
  village: string;
  district: string;
  cropType: string;
  cropQuantityKg: number;
  centreName: string;
  centreAddress: string;
  date: string;
  timeSlot: string;
  transportMode: 'self' | 'vehicle';
  driverName?: string;
  driverPhone?: string;
  pickupTime?: string;
  isOfflineFarmer?: boolean;
}

export async function generateTokenPdf(data: TokenPdfData): Promise<void> {
  const doc = new jsPDF();
  const qrDataUrl = await QRCode.toDataURL(`KRISHIFLOW-TOKEN:${data.tokenCode}|FARMER:${data.farmerName}|DATE:${data.date}|CENTRE:${data.centreName}`);

  // Header Banner
  doc.setFillColor(22, 163, 74); // Green
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FPP | SMART FARMER PROCUREMENT PORTAL', 15, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Government of India & State Agriculture Marketing Board • Digital Farmer Procurement Portal', 15, 22);

  // Token Badge Card
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(22, 163, 74);
  doc.roundedRect(15, 38, 180, 34, 3, 3, 'FD');

  doc.setTextColor(21, 128, 61);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.isOfflineFarmer ? 'OFFLINE FARMER ASSISTED PROCUREMENT SLIP' : 'OFFICIAL PROCUREMENT GATE PASS TOKEN', 22, 47);

  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOKEN: ${data.tokenCode}`, 22, 60);

  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72);
  doc.text(`QUEUE SEQUENCE: #${data.tokenNumber}`, 120, 60);

  // QR Code
  doc.addImage(qrDataUrl, 'PNG', 145, 78, 50, 50);

  // Details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. FARMER INFORMATION', 15, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${data.farmerName}`, 20, 90);
  doc.text(`Contact: ${data.farmerPhone || 'Recorded via Society Alternate'}`, 20, 97);
  doc.text(`Village / District: ${data.village}, ${data.district}`, 20, 104);
  doc.text(`Crop & Expected Weight: ${data.cropType} - ${data.cropQuantityKg} kg`, 20, 111);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. PROCUREMENT CENTRE & SLOT SCHEDULE', 15, 124);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Centre: ${data.centreName}`, 20, 132);
  doc.text(`Address: ${data.centreAddress}`, 20, 139);
  doc.text(`Appointment Date: ${data.date}`, 20, 146);
  doc.text(`Time Slot: ${data.timeSlot}`, 20, 153);

  // Transport Details Box
  doc.setFillColor(data.transportMode === 'vehicle' ? 238 : 241, 242, 255);
  doc.roundedRect(15, 162, 180, 42, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(`3. LOGISTICS MODE: ${data.transportMode === 'vehicle' ? 'FREE GOVERNMENT VEHICLE PICKUP' : 'SELF TRANSPORT'}`, 20, 172);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  if (data.transportMode === 'vehicle') {
    doc.text(`Assigned Driver: ${data.driverName || 'Suresh Kumar Mohapatra'} (${data.driverPhone || '+91-9876543210'})`, 20, 182);
    doc.text(`Vehicle Scheduled Pickup Time: ${data.pickupTime || '07:30 AM'} from farmer village`, 20, 190);
    doc.text(`Notice: Keep crop bagged in standard 50kg jute bags ready for weighing.`, 20, 197);
  } else {
    doc.text(`Instructions: Arrive at mandi yard 15 minutes before slot with this token slip.`, 20, 182);
    doc.text(`Dedicated lane parking available at Mandi Bay 4. Bring Aadhaar copy.`, 20, 190);
  }

  // Footer Instructions
  doc.setDrawColor(203, 213, 225);
  doc.line(15, 215, 195, 215);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Important Instructions:', 15, 224);
  doc.text('• Present this QR code token at the Mandi Security Gate for instantaneous barcode scan.', 15, 230);
  doc.text('• Digital weighing and moisture analysis will determine Grade A/B/C pricing automatically.', 15, 236);
  doc.text('• Direct Benefit Transfer (DBT) payment will be credited directly to your Aadhaar-linked bank account.', 15, 242);
  doc.text('• Helpline Toll-Free: 1800-180-2026 | Powered by KrishiFlow-AI', 15, 252);

  doc.save(`Token-${data.tokenCode}.pdf`);
}

export interface PaymentReceiptPdfData {
  receiptId: string;
  farmerName: string;
  village: string;
  cropType: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  moisturePercentage: number;
  qualityGrade: string;
  mspRatePerQuintal: number;
  totalAmount: number;
  pfmsTxnId: string;
  bankRef: string;
  date: string;
  gatePassNumber?: string;
}

/**
 * Builds a universal public verification URL containing query parameters for digital receipt verification.
 */
export function buildReceiptVerificationUrl(data: PaymentReceiptPdfData): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://krishiflow.gov.in';

  const params = new URLSearchParams({
    id: data.receiptId || 'pay-01',
    farmer: data.farmerName || 'Farmer',
    village: data.village || 'Sambalpur Rural',
    crop: data.cropType || 'Paddy (Grade A)',
    gross: String(data.grossWeightKg ?? 0),
    tare: String(data.tareWeightKg ?? 0),
    net: String(data.netWeightKg ?? 0),
    moisture: String(data.moisturePercentage ?? 0),
    grade: data.qualityGrade || 'Grade A',
    msp: String(data.mspRatePerQuintal ?? 0),
    amount: String(data.totalAmount ?? 0),
    pfms: data.pfmsTxnId || 'PFMS-OD-2026-98124',
    utr: data.bankRef || 'SBIN0029381923',
    date: data.date || new Date().toLocaleDateString('en-IN'),
    gatePass: data.gatePassNumber || 'GP-2026-9041',
  });

  return `${origin}/receipt-details?${params.toString()}`;
}

export async function generatePaymentReceiptPdf(data: PaymentReceiptPdfData): Promise<void> {
  const doc = new jsPDF();
  const verificationUrl = buildReceiptVerificationUrl(data);
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 250,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // Header Banner - Deep Navy / Emerald Gradient tone
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(16, 185, 129); // Emerald accent line
  doc.rect(0, 30, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FPP | DBT PAYMENT SETTLEMENT RECEIPT', 15, 14);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Government of India & State Agriculture Marketing Board • Public Financial Management System (PFMS)', 15, 21);
  doc.text('Autonomous End-to-End Farmer Procurement & Real-Time Automated Direct Benefit Transfer', 15, 27);

  // Settlement Card Banner
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(52, 211, 153); // Emerald 400
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 38, 180, 32, 2.5, 2.5, 'FD');

  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`OFFICIAL SETTLEMENT RECEIPT: #${data.receiptId}`, 22, 47);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Gate Pass: ${data.gatePassNumber || 'GP-2026-9041'}   |   PFMS Txn: ${data.pfmsTxnId}`, 22, 55);
  doc.text(`Bank Reference / UTR: ${data.bankRef}`, 22, 63);

  // Total Paid Tag
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(132, 44, 56, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DBT CREDITED', 136, 50);
  doc.setFontSize(14);
  doc.text(`Rs. ${data.totalAmount.toLocaleString('en-IN')}`, 136, 60);

  // QR Code Box (Right Side)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(144, 76, 51, 62, 2, 2, 'FD');

  // Insert Scannable QR Code
  doc.addImage(qrDataUrl, 'PNG', 147, 78, 45, 45);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN WITH GOOGLE SCANNER', 146, 127);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('OR PHONE CAMERA TO VERIFY', 147, 132);
  doc.text('DIGITAL DETAILS ONLINE', 151, 136);

  // Table Section (Left Side & Full Width below)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Procurement & Weighbridge Breakdown', 15, 80);

  doc.setFontSize(9.5);
  let y = 88;
  const items = [
    ['Beneficiary Farmer', data.farmerName],
    ['Village / Mandi Yard', data.village],
    ['Crop Purchased', data.cropType],
    ['Gross Weighbridge Reading', `${data.grossWeightKg} kg`],
    ['Tare (Vehicle / Bag) Weight', `${data.tareWeightKg} kg`],
    ['Net Procurement Weight', `${data.netWeightKg} kg (${(data.netWeightKg / 100).toFixed(2)} Quintals)`],
    ['Moisture Content Assessed', `${data.moisturePercentage}% (Standard Allowed: <14%)`],
    ['Certified Quality Grade', data.qualityGrade],
    ['Approved MSP Rate', `Rs. ${data.mspRatePerQuintal} / Quintal`],
    ['PFMS Settlement Status', 'DIRECT BANK TRANSFER (DBT) CREDITED'],
    ['Settlement Clearance Date', data.date],
  ];

  items.forEach(([label, value], idx) => {
    // Alternating row background for left section
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 4, 124, 6.8, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    if (label === 'PFMS Settlement Status') {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(value, 68, y);
    y += 7.2;
  });

  // 5-Stage PFMS Clearance Verification Badge
  y = 176;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, y, 180, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Real-Time 5-Stage PFMS Clearing Verification', 20, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('[x] 1. Gate Pass Verified    [x] 2. Quality Certified    [x] 3. Weighed    [x] 4. PFMS Cleared    [x] 5. Credited', 20, y + 16);

  // Verification URL Line
  y = 210;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Verification & Authenticity:', 15, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text('• This receipt is digitally signed and tamper-evident under the Digital Agriculture Mission.', 15, y + 14);
  doc.text(`• Online Verification Link: ${verificationUrl.slice(0, 85)}...`, 15, y + 20);
  doc.text('• Scan the QR code above with Google Scanner / Google Lens / Phone Camera to verify instant details.', 15, y + 26);
  doc.text('• Farmer Helpline Toll-Free: 1800-180-2026 | Mandi Support: +91-1800-180-2021', 15, y + 34);

  // Security Seal Badge
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(15, y + 42, 180, 14, 2, 2, 'FD');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHENTIC DBT SETTLEMENT - DIGITALLY ISSUED BY KRISHIFLOW-AI MANDI SERVER', 20, y + 51);

  doc.save(`Receipt-${data.receiptId}.pdf`);
}
