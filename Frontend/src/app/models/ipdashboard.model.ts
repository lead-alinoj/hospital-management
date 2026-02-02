import { Bed } from "./bed.model";
import { IPAdmission } from "./ipAdmission.model";
import { IPCharge } from "./ipCharge.model";
import { Patient } from "./patient.model";

export interface IPDashboardStats {
  totalIPPatients: number;
  occupiedBeds: number;
  availableBeds: number;
  todayAdmissions: number;
  todayDischarges: number;
  observationCases: number;
  
  // Ward/Room occupancy
  wardOccupancy: Array<{
    ward: string;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  }>;
  
  // Today's activity
  todaysActivity: Array<{
    time: Date;
    patientName: string;
    action: 'ADMISSION' | 'DISCHARGE' | 'TRANSFER';
    bedNumber: string;
    unit: string;
  }>;
}

export interface PatientSummary {
  patient: Patient;
  admission: IPAdmission;
  bed: Bed;
  vitals: any[];
  charges: IPCharge[];
  totalDue: number;
  lastVitalTime?: Date;
  nextMedicationTime?: Date;
}