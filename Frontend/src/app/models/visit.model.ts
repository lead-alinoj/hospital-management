export interface Visit {
  _id: string;
  patient: any;
  visitDate: Date;
  visitType: 'OP' | 'IP' | 'Emergency' | 'FollowUp';
  doctor: any;
  tokenNumber: number;
  chiefComplaint?: string;
  visitStatus: VisitStatus;
  priority: 'Normal' | 'High' | 'Emergency';
  paymentStatus: 'Pending' | 'Paid' | 'Partially_Paid' | 'Insurance';
  createdBy: any;
  updatedBy?: any;
  vitals?: any;
  diagnosis?: any;
  prescriptions?: any[];
  createdAt: Date;
  updatedAt: Date;
  shift: 'Morning' | 'Evening';}

export type VisitStatus = 
  | 'Waiting'
  | 'Vitals_In_Progress'
  | 'Vitals_Completed'
  | 'Consultation_In_Progress'
  | 'Consultation_Completed'
  | 'Pharmacy'
  | 'Completed';

export interface CreateVisitRequest {
  patientId: string;
  doctorId: string;
  chiefComplaint?: string;
   visitType: 'OP' | 'IP' | 'Emergency' | 'FollowUp';  
  priority?: 'Normal' | 'High' | 'Emergency';
  shift: 'Morning' | 'Evening';
}

export interface TodayVisitsResponse {
  success: boolean;
  data: {
    waiting: Visit[];
    vitals_in_progress: Visit[];
    vitals_completed: Visit[];
    consultation_in_progress: Visit[];
    consultation_completed: Visit[];
     pharmacy?: Visit[];
    completed?: Visit[];
  };
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
}