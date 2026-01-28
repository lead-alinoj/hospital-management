export interface Attendance {
  _id?: string;
  date: Date;
  staffId: string;
  staffName: string;
jobRole: string;
shiftId: string;   
 inTime: Date;
  outTime?: Date;
  status: 'Present' | 'Absent' | 'Half Day';
  remarks?: string;
  enteredBy: string;
  createdTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
  totalMinutes?: number;

}

export interface MarkAttendanceDto {
  date: Date;
  staffId: string;
  staffName: string;
  jobRole: string;
   shiftId: string;
  inTime: string;
  outTime?: string;
  status: 'Present' | 'Absent' | 'Half Day';
  remarks?: string;
}

export interface UpdateAttendanceDto {
  outTime?: string;
  status?: 'Present' | 'Absent' | 'Half Day';
  remarks?: string;
}

export interface AttendanceFilter {
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  staffId?: string;
  jobRole?: string;
}
