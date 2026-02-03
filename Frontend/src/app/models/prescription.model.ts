export interface PrescriptionMedicine {
  medicineId: string;
  medicineName: string;
  strength: string;
  dosage: string; // e.g., "1 tablet"
  frequency: string; // e.g., "BD", "TDS"
  duration: string; // e.g., "5 days"
  instructions: string;
  quantity: number;
  route: string; // Oral, Topical, etc.
  timing: string; // Before food, After food
}
// NEW – HMS prescription format
export interface PrescriptionMedicineHMS {
  medicineId: string;
  medicineName: string;
  strength: string;

  qty: number;
  take: string;

  morning: boolean;
  noon: boolean;
  evening: boolean;
  night: boolean;

  days: number;

  instructions?: string;
  route?: string;
  timing?: string;
}

export interface Prescription {
  _id?: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  icd10Code?: string;
  clinicalNotes?: string;
  patientType: 'OP' | 'IP'; 
  medicines: PrescriptionMedicine[];
  advice?: string;
  followupDate?: Date;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePrescriptionRequest {
  visitId: string;
  diagnosis: string;
  icd10Code?: string;
  clinicalNotes?: string;
  medicines: {
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
    route?: string;
    timing?: string;
     patientType: 'OP' | 'IP'; // 
  }[];
  advice?: string;
  followupDate?: Date;
}

export interface PrescriptionResponse {
  success: boolean;
  data: Prescription;
  message?: string;
}