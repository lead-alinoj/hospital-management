export interface Vitals {
  _id: string;
  visit: string;
  patient: string;
  height: {
    value?: number;
    unit: string;
  };
  weight: {
    value?: number;
    unit: string;
  };
  bmi: number;
  bloodPressure: {
    systolic?: number;
    diastolic?: number;
    unit: string;
  };
  pulse: {
    value?: number;
    unit: string;
  };
  temperature: {
    value?: number;
    unit: string;
  };
  spo2: {
    value?: number;
    unit: string;
  };
  respiratoryRate: {
    value?: number;
    unit: string;
  };
  bloodSugar: {
    value?: number;
    unit: string;
    type?: 'Fasting' | 'Postprandial' | 'Random';
  };
  painScore: {
    value?: number;
    location?: string;
  };
  remarks?: string;
  recordedBy: any;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface UpdateVitalsRequest {
  height?: number;
  weight?: number;
  bloodPressure?: {
    systolic?: number;
    diastolic?: number;
  };
  pulse?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  bloodSugar?: {
    value?: number;
    type?: 'Fasting' | 'Postprandial' | 'Random';
  };
  painScore?: {
    value?: number;
    location?: string;
  };
  remarks?: string;
}

export interface RecordVitalsRequest {
  visitId: string;
  height?: number;
  weight?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  pulse?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  bloodSugar?: {
    value: number;
    type?: 'Fasting' | 'Postprandial' | 'Random';
  };
  painScore?: {
    value: number;
    location?: string;
  };
  remarks?: string;
  
}
