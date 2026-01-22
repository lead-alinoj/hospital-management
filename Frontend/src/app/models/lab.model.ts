export interface LabResult {
  _id: string;
  visit: string;
  patient: string;
  testCode: string;
  testName: string;
  testCategory: 'Blood' | 'Urine' | 'Stool' | 'Imaging' | 'Biopsy' | 'Other';
  subCategory?: string;
  sampleType?: string;
  resultValue: any;
  unit?: string;
  referenceRange: {
    low?: any;
    high?: any;
    text?: string;
  };
  status: 'Pending' | 'Sample_Collected' | 'Processing' | 'Completed' | 'Cancelled';
  resultType: 'Numeric' | 'Text' | 'Positive/Negative' | 'Range';
  remarks?: string;
  isCritical: boolean;
  performedBy?: any;
  verifiedBy?: any;
  enteredBy: any;
  enteredAt: Date;
  reportedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabResultRequest {
  visitId: string;
  testCode: string;
  testName: string;
  testCategory: 'Blood' | 'Urine' | 'Stool' | 'Imaging' | 'Biopsy' | 'Other';
  subCategory?: string;
  sampleType?: string;
  resultValue: any;
  unit?: string;
  referenceRange?: {
    low?: any;
    high?: any;
    text?: string;
  };
  status?: 'Pending' | 'Sample_Collected' | 'Processing' | 'Completed' | 'Cancelled';
  resultType?: 'Numeric' | 'Text' | 'Positive/Negative' | 'Range';
  remarks?: string;
}

export interface LabTestTemplate {
  code: string;
  name: string;
  category: string;
  subCategory?: string;
  unit?: string;
  referenceRange: {
    low?: number;
    high?: number;
    text?: string;
  };
  resultType: 'Numeric' | 'Text' | 'Positive/Negative' | 'Range';
}