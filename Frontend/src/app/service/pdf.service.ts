import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HospitalService } from './hospital.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private hospitalService = inject(HospitalService);
  async getHospital(): Promise<any> {
    const res: any = await firstValueFrom(this.hospitalService.getHospital());
    return res?.data || {};
  }
  async generatePrescriptionPDF(
  prescription: any,
  vitals?: any
): Promise<jsPDF> {

  const hospital = await this.getHospital();
  const doc = new jsPDF('p', 'mm', 'a4');

  let y = 15;
if (hospital.logo) {
  const logoUrl = `${window.location.origin}${hospital.logo}`;

  const logoBase64 = await this.getImageBase64('assets/images/logo.png');

if (logoBase64) {
  doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30);
  y = 45;
  }
}

  // ===== HEADER =====
  doc.setFontSize(16).setFont('helvetica', 'bold');
  doc.text(hospital.name, 105, y, { align: 'center' });

  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text(`${hospital.address}, ${hospital.city}`, 105, y + 5, { align: 'center' });
  doc.text(`Ph: ${hospital.phone}`, 105, y + 10, { align: 'center' });

  doc.line(10, y + 14, 200, y + 14);
  y += 20;

  // ===== PATIENT =====
  const p = prescription.patientId;
  doc.setFontSize(11).setFont('helvetica', 'bold');
  doc.text('Patient Details', 10, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${p.fullName}`, 10, y);
  doc.text(`Age/Gender: ${p.age} / ${p.gender}`, 120, y);
  y += 5;
  doc.text(`OP No: ${p.opNumber}`, 10, y);
  y += 8;

  // ===== DOCTOR =====
  const d = prescription.doctorId;
  doc.setFont('helvetica', 'bold');
  doc.text(`Doctor: Dr. ${d.name}`, 10, y);
  y += 6;
doc.text(`Specialization: ${d.specialization || '-'}`, 10, y);
  y += 8;

  // ===== DIAGNOSIS =====
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnosis:', 10, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.diagnosis || '-', 10, y);
  y += 8;

  // ===== MEDICINES =====
  doc.setFont('helvetica', 'bold');
  doc.text('Prescription:', 10, y);
  y += 6;

  if (!prescription.medicines || prescription.medicines.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('No medicines prescribed', 10, y);
    y += 6;
  } else {
   autoTable(doc, {
  startY: y,
  head: [[
    'S.No',
    'Medicine',
    'Qty',
    'M',
    'N',
    'E',
    'Nt',
    'Take',
    'Days'
  ]],

  body: prescription.medicines.map((m: any, i: number) => [
    i + 1,
    m.medicineName || m.name,
    m.quantity || '-',
    m.morning ? '1' : '-',
    m.noon ? '1' : '-',
    m.evening ? '1' : '-',
    m.night ? '1' : '-',
    m.take || '-',
    m.days || '-'
  ]),

  styles: {
    fontSize: 9,
    cellPadding: 3,
    halign: 'center',
    valign: 'middle'
  },

  headStyles: {
    fillColor: [41, 128, 185],
    textColor: 255,
    fontSize: 9,
    halign: 'center'
  },

  columnStyles: {
    0: { cellWidth: 10 },   // S.No
    1: { cellWidth: 40, halign: 'left' }, // Medicine
    2: { cellWidth: 12 },   // Qty
    3: { cellWidth: 10 },   // M
    4: { cellWidth: 10 },   // N
    5: { cellWidth: 10 },   // E
    6: { cellWidth: 10 },   // Nt
    7: { cellWidth: 30 },   // Take
    8: { cellWidth: 12 }    // Days
  }
});

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== FOOTER =====
  doc.setFontSize(8);
  doc.text(
    'Computer generated prescription – No signature required',
    105,
    290,
    { align: 'center' }
  );

  return doc;
}


private async getImageBase64(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      resolve(canvas.toDataURL());
    };

    img.onerror = () => {
      console.error('Logo load failed:', imageUrl);
      resolve(null);
    };

    img.src = imageUrl;
  });
}


  /**
   * Generate Hospital Visit Summary PDF dynamically
   * @param prescription Prescription object (from backend)
   * @param vitals Vitals object (optional)
   * @param billing Billing object containing medicineAmount, labCharges, consultationFee, otherCharges, totalAmount
   */
  async generateHospitalVisitPDF(prescription: any, vitals: any = null, billing: any = null): Promise<jsPDF> {
    try {
      // Fetch hospital data dynamically
const hospitalResp: any = await firstValueFrom(this.hospitalService.getHospital());
const hospital = hospitalResp?.data ?? hospitalResp ?? {};

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica');

      let yPos = 20;

      // ========== HOSPITAL HEADER ==========
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(hospital.name || 'Hospital Name', 105, yPos, { align: 'center' });
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (hospital.tagline) doc.text(hospital.tagline, 105, yPos, { align: 'center' });
      yPos += 5;
      if (hospital.services) doc.text(hospital.services, 105, yPos, { align: 'center' });

      yPos += 8;
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      yPos += 7;

      // ========== PATIENT DETAILS ==========
      const patient = prescription.patientId || {};
      doc.setFont('helvetica', 'bold');
      doc.text('Patient Information:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      doc.text(`Register No.: ${patient.opNumber || '-'}`, 20, yPos);
      yPos += 5;
      doc.text(`Name: ${patient.fullName || '-'} (${patient.age || '-'} / ${patient.gender || '-'})`, 20, yPos);
      yPos += 5;
      
      if (vitals || prescription.vitals) {
        const vitalsData = vitals || prescription.vitals;
        doc.text(`Pulse: ${vitalsData.pulse || '-'} b/min  Temp: ${vitalsData.temperature || '-'} °F  SpO₂: ${vitalsData.spo2 || '-'}%`, 20, yPos);
        yPos += 5;
        doc.text(`RR: ${vitalsData.respiratoryRate || '-'} bpm`, 20, yPos);
        yPos += 5;
      }
      
      if (patient.address) {
        doc.text(`Address: ${patient.address}`, 20, yPos);
        yPos += 7;
      }

      // ========== VISIT DETAILS ==========
      doc.setFont('helvetica', 'bold');
      doc.text('Visit Details:', 20, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`Prescription ID: ${prescription._id || '-'}`, 20, yPos);
      yPos += 5;
      const visitDate = new Date(prescription.createdAt || new Date());
      doc.text(`Date: ${visitDate.toLocaleDateString()}  Time: ${visitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 20, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Medical Details:', 20, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      if (prescription.chiefComplaint) doc.text(`Complaints: ${prescription.chiefComplaint}`, 20, yPos);
      yPos += 5;
      if (prescription.diagnosis) doc.text(`Diagnosis: ${prescription.diagnosis}`, 20, yPos);

      // ========== MEDICINES ==========
      yPos += 7;
      if (prescription.medicines && prescription.medicines.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Medication:', 20, yPos);
        yPos += 5;

        const medicinesData = prescription.medicines.map((med: any, index: number) => [
          index + 1,
          med.medicineName || med.name || '-',
          med.quantity || '-',
          med.take || '-',
          med.morning ? '✓' : '-',
          med.noon ? '✓' : '-',
          med.evening ? '✓' : '-',
          med.night ? '✓' : '-',
          med.days || '-',
          // `₹${med.unitPrice || med.price || 0}`
        ]);

    autoTable(doc, {
  startY: yPos,
  head: [['S.No', 'Medicine', 'Qty', 'Take', 'M', 'N', 'E', 'Nt', 'Days']],
  body: medicinesData,

  styles: {
    fontSize: 9,
    cellPadding: 3,
    halign: 'center',
    valign: 'middle'
  },

  headStyles: {
    fillColor: [41, 128, 185],
    textColor: 255,
    fontSize: 9,
    halign: 'center'
  },

  columnStyles: {
    0: { cellWidth: 10 },
    1: { cellWidth: 45, halign: 'left' },
    2: { cellWidth: 12 },
    3: { cellWidth: 25 },
    4: { cellWidth: 10 },
    5: { cellWidth: 10 },
    6: { cellWidth: 10 },
    7: { cellWidth: 10 },
    8: { cellWidth: 12 }
  },

  margin: { left: 20, right: 20 }
});


        yPos = (doc as any).lastAutoTable.finalY + 7;
      }

      // ========== ADVICE ==========
      if (prescription.advice) {
        doc.setFont('helvetica', 'bold');
        doc.text('ADVICE:', 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const adviceLines = doc.splitTextToSize(prescription.advice, 170);
        doc.text(adviceLines, 20, yPos);
        yPos += adviceLines.length * 5 + 5;
      }

      // ========== BILLING ==========
      if (billing) {
        doc.setFont('helvetica', 'bold');
        doc.text('Billing Summary (₹):', 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Medicine Amount: ${billing.medicineAmount || 0}`, 20, yPos);
        yPos += 5;
        doc.text(`Lab Charges: ${billing.labCharges || 0}`, 20, yPos);
        yPos += 5;
        doc.text(`Consultation Fee: ${billing.consultationFee || 0}`, 20, yPos);
        yPos += 5;
        doc.text(`Other Charges: ${billing.otherCharges || 0}`, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Amount: ${billing.totalAmount || 0}`, 20, yPos);
        yPos += 7;
      }

      // ========== DOCTOR INFO ==========
      const doctor = prescription.doctorId || {};
      doc.setFont('helvetica', 'bold');
      doc.text('Prescribed By:', 20, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`Dr. ${doctor.name || '-'}`, 20, yPos);
      yPos += 5;
      if (doctor.registrationNumber) {
        doc.text(`Registration: ${doctor.registrationNumber}`, 20, yPos);
        yPos += 5;
      }

      // ========== FOOTER ==========
      doc.setFontSize(8);
      doc.text('This is a Computer generated Prescription - No need of Doctor\'s Signature.', 105, 285, { align: 'center' });
      if (hospital.address) doc.text(`Address: ${hospital.address}`, 105, 290, { align: 'center' });
      if (hospital.phone) doc.text(`Contact: ${hospital.phone}`, 105, 295, { align: 'center' });

      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Return a basic PDF if there's an error
      const doc = new jsPDF();
      doc.text('Error generating prescription PDF', 20, 20);
      return Promise.resolve(doc);
    }
  }
}