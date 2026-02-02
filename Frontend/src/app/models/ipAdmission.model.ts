import { Patient } from './patient.model';
import { Visit } from './visit.model';
import { Bed } from './bed.model';
import { CareUnit } from './careUnit.model';

export type AdmissionStatus = 'NOT_ADMITTED' | 'IP_ACTIVE' | 'DISCHARGED';
export type AdmissionType = 'EMERGENCY' | 'DOCTOR_ADVISED' | 'OBSERVATION';

export interface IPAdmission {
  _id?: string;
  
  // References
  visit: Visit | string;
  patient: Patient | string;
  bed: Bed | string;
  
  // Status
  admissionStatus: AdmissionStatus;
  admissionType: AdmissionType;
  
  // Dates
  admissionDate: Date;
  dischargeDate?: Date;
  expectedDischargeDate?: Date;
  
  // Medical Details
  admissionReason: string;
  clinicalNotes?: string;
  diagnosis?: string;
  
  // Doctor's Input
  doctorNotes?: string;
  expectedStayDays?: number;
  nursingInstructions?: string;
  
  // Observation Cases
  isObservationCase?: boolean;
  observationEndTime?: Date;
  observationReason?: string;
  
  // Emergency Admission
  admittedByReception?: boolean;
  emergencyContactNotified?: boolean;
  
  // Discharge Details
  dischargeNotes?: string;
  dischargeSummary?: string;
  dischargedBy?: string;
  
  // Billing (simplified for now)
  billingGenerated: boolean;
  totalCharges?: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmergencyAdmissionRequest {
    patientId: string;
  visitType?: string;
  priority?: string;

  shift: string;

  bedId: string;
  admissionReason: string;
  isObservationCase?: boolean;
  observationEndTime?: Date;
  emergencyContactNotified?: boolean;
}

export interface DoctorAdvisedAdmissionRequest {
  visitId: string;
  bedId?: string;   // ✅ optional
  admissionType?: 'DOCTOR_ADVISED' | 'OBSERVATION';
  admissionNotes?: string;
  observationEndTime?: Date;
}

export interface DischargeRequest {
  visitId: string;
  dischargeNotes?: string;
  dischargeSummary?: string;
}

export interface CancelAdmissionRequest {
  visitId: string;
  cancellationReason?: string;
}

export interface BedAvailabilityResponse {
  success: boolean;
  data: {
    availableBeds: Bed[];
    groupedBeds: {
      [key: string]: {
        unit: CareUnit;
        beds: Bed[];
      }
    };
    totalAvailable: number;
  };
  message?: string;
}

export interface CurrentIPPatientsResponse {
  success: boolean;
  data: IPAdmission[];
  count: number;
  message?: string;
}

export interface AdmissionRecommendation {
  visitId: string;
  admissionType: AdmissionType;
  admissionNotes: string;
  expectedStayDays?: number;
  nursingInstructions?: string;
  specialRequirements?: {
    needsOxygen?: boolean;
    needsIsolation?: boolean;
    needsCriticalCare?: boolean;
  };
  status: 'RECOMMENDED' | 'APPROVED' | 'REJECTED';
}