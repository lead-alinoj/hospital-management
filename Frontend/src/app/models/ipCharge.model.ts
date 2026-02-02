export interface IPCharge {
  _id: string;
  visit: string; // Visit ID
  patient: string; // Patient ID
  
  // Charge Details
  description: string;
  category: 'MEDICINE' | 'PROCEDURE' | 'CONSULTATION' | 'ROOM' | 'NURSING' | 'LAB' | 'OTHER';
  
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  
  // Added by
  addedBy: {
    role: 'DOCTOR' | 'NURSE' | 'RECEPTION';
    userId: string;
    name: string;
  };
  
  // Approval (for high-cost items)
  requiresApproval?: boolean;
  approvedBy?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Dates
  dateAdded: Date;
  dateModified?: Date;
  
  // Status
  isActive: boolean;
  isBilled: boolean;
  billingId?: string;
  
  notes?: string;
}

export interface CreateIPChargeRequest {
  visitId: string;
  patientId: string;
  description: string;
  category: 'MEDICINE' | 'PROCEDURE' | 'CONSULTATION' | 'ROOM' | 'NURSING' | 'LAB' | 'OTHER';
  quantity: number;
  unitPrice: number;
  notes?: string;
  requiresApproval?: boolean;
}

export interface UpdateIPChargeRequest {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
  isActive?: boolean;
}

export interface IPChargeResponse {
  success: boolean;
  data: IPCharge | IPCharge[];
  message?: string;
}