export interface Staff {
  _id?: string;
  staffId: string;
  name: string;
    jobRole: string;

  systemRole: 'None' | 'Admin' | 'Reception' | 'Doctor' | 'Nurse' | 'Pharmacy';
  phone: string;
  salary: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdBy: string;
  createdDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  joiningDate?: Date;
  address?: string;
  qualification?: string;
  salaryType?: 'Monthly' | 'Daily' | 'PerVisit';

  bankDetails?: BankDetails;
  idProof?: IdProof;

}
export interface IdProof {
  type?: 'Aadhaar' | 'PAN' | 'VoterID' | 'DrivingLicense';
  number?: string;
}
export interface BankDetails {
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
}
export interface CreateStaffDto {
  name: string;
  jobRole: string;       // ✅ REQUIRED
  systemRole?: 'None' | 'Admin' | 'Reception'| 'Doctor' | 'Nurse' | 'Pharmacy';
  phone: string;

  gender?: Staff['gender'];
  joiningDate?: Date;
  address?: string;
  qualification?: string;
  salaryType?: Staff['salaryType'];

  bankDetails?: BankDetails;
  idProof?: IdProof;

  salary: number;
  status: 'Active' | 'Inactive';
  notes?: string;
}


export interface UpdateStaffDto {
  name?: string;
  systemRole?: 'None' | 'Doctor' | 'Nurse' | 'Reception' | 'Pharmacy' | 'Admin';
  phone?: string;
  salary?: number;
  status?: 'Active' | 'Inactive';
  notes?: string;
}