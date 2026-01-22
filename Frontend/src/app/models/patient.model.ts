export interface Patient {
  _id: string;
  opNumber: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: Date;
  age: number;
  mobile: string;
  email?: string;
  idProof?: {
  type?: string;
  number?: string;
};

  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  emergencyContact: {
    name?: string;
    relation?: string;
    mobile?: string;
  };
  medicalHistory: {
    allergies: string[];
    chronicDiseases: string[];
    previousSurgeries: string[];
    currentMedications: string[];
  };
  bloodGroup?: string;
  patientType: 'OP' | 'IP';
  isActive: boolean;
  createdBy: any;
  updatedBy?: any;
  createdAt: Date;
  updatedAt: Date;
   lastVisitDate?: Date; 
}

export interface CreatePatientRequest {
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
 dateOfBirth?: Date;
age?: number;
idProof?: {
  type?: string;
  number?: string;
};

  mobile: string;
  email?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  emergencyContact: {
    name?: string;
    relation?: string;
    mobile?: string;
  };
  medicalHistory: {
    allergies: string[];
    chronicDiseases: string[];
    previousSurgeries: string[];
    currentMedications: string[];
  };
  bloodGroup?: string;
  patientType: 'OP' | 'IP';
}

export interface PatientSearchResponse {
  success: boolean;
  data: Patient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}