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
          `₹${med.unitPrice || med.price || 0}`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['S.No.', 'Medicine Name', 'Qty', 'Take', 'M', 'N', 'E', 'Nt', 'Days', 'Price']],
          body: medicinesData,
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
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