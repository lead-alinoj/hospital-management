export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | null; 
  isActive: boolean;
  department?: string;
  phone?: string;
  status?: 'Pending' | 'Active' | 'Inactive' | 'Blocked';
  lastLogin?: Date;
  lastPasswordReset?: Date;
  createdBy?: string;
  updatedBy?: string;
  loginAttempts?: number;
  lockUntil?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  specialization?: string;

}

// HMS Roles - Only these 5 roles
export type UserRole = 
  | 'Admin'       // System administrator
  | 'Doctor'      // Medical doctor
  | 'Nurse'       // Nursing staff
  | 'Reception'   // Front desk receptionist
  | 'Pharmacy';   // Pharmacy staff

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
// Add these interfaces
export interface UpdateRoleRequest {
  role: UserRole;
}

export interface UpdateStatusRequest {
  isActive: boolean;
}

export interface UserListResponse {
  success: boolean;
  count: number;
  data: User[];
}