import { Patient } from './patient.model';
import { Visit } from './visit.model';

export interface Bed {
  _id: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
  careUnit: any;
  currentPatient?: any;
  admissionDate?: Date;
  isActive: boolean;
}


export interface BedResponse {
  success: boolean;
  data: Bed | Bed[];
  message?: string;
}
