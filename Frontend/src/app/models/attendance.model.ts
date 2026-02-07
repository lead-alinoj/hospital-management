// attendance.model.ts
export interface Attendance {
  _id?: string;
  date: Date;
  staffId: string;
  staffName: string;
  jobRole: string;
  totalMinutes?: number;
  overtimeMinutes?: number;
  shiftId?: any;
  inTime: Date;
  outTime?: Date;
  status: 'Present' | 'Absent' | 'Half Day';
  remarks?: string;
  enteredBy: string;
  createdTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  adminLogout?: boolean;
  adminOutTime?: Date;
  logoutReason?: string;
  adminClosedBy?: string;
}

export interface MarkAttendanceDto {
  date: Date;
  staffId: string;
  staffName: string;
  jobRole: string;
  shiftId: string;
  inTime: string | Date;
  outTime?: string;
  status?: 'Present' | 'Absent' | 'Half Day';
  remarks?: string;
}

export interface UpdateAttendanceDto {
  outTime?: string | Date;
  status?: string;
  remarks?: string;
}

export interface AttendanceFilter {
  startDate?: string | Date;
  endDate?: string | Date;
  staffId?: string;
  jobRole?: string;
  shiftId?: string;
}

export interface Shift {
  _id?: string;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  fullDayMinutes: number;
  halfDayMinutes: number;
  maxMinutes: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}