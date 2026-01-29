import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attendance, MarkAttendanceDto, UpdateAttendanceDto, AttendanceFilter } from '../models/attendance.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  // Mark attendance
  markAttendance(attendanceData: MarkAttendanceDto): Observable<{ success: boolean; data: Attendance; message: string }> {
    return this.http.post<{ success: boolean; data: Attendance; message: string }>(`${this.apiUrl}/mark`, attendanceData);
  }

  // Update attendance
  updateAttendance(id: string, attendanceData: UpdateAttendanceDto): Observable<{ success: boolean; data: Attendance; message: string }> {
    return this.http.put<{ success: boolean; data: Attendance; message: string }>(`${this.apiUrl}/update/${id}`, attendanceData);
  }

  // Get today's attendance
  getTodayAttendance(): Observable<{ success: boolean; data: Attendance[] }> {
    return this.http.get<{ success: boolean; data: Attendance[] }>(`${this.apiUrl}/today`);
  }

  // Get staff attendance
  getStaffAttendance(staffId: string, filter?: { startDate?: Date; endDate?: Date }): Observable<{ success: boolean; data: Attendance[] }> {
    let params = new HttpParams();
if (filter?.startDate)
params = params.set('startDate', String(filter.startDate));

if (filter?.endDate)
params = params.set('endDate', String(filter.endDate));


    return this.http.get<{ success: boolean; data: Attendance[] }>(`${this.apiUrl}/staff/${staffId}`, { params });
  }
getPendingLogout(): Observable<{ success: boolean; data: Attendance[] }> {
  return this.http.get<{ success: boolean; data: Attendance[] }>(
    `${this.apiUrl}/pending-logout`
  );
}

  // Get attendance by date
  getAttendanceByDate(date: Date): Observable<{ success: boolean; data: Attendance[] }> {
    const dateStr = date.toISOString().split('T')[0];
    return this.http.get<{ success: boolean; data: Attendance[] }>(`${this.apiUrl}/date/${dateStr}`);
  }

  // Get attendance by date range
  // Get attendance by date range
  getAttendanceByDateRange(filter: AttendanceFilter): Observable<{ success: boolean; data: Attendance[] }> {
    let params = new HttpParams();
    
    // Fix: Format dates to strings for the API
  if (filter.startDate) params = params.set('startDate', filter.startDate as string);

if (filter.endDate)params = params.set('endDate', filter.endDate as string);


    if (filter.staffId) params = params.set('staffId', filter.staffId);
    if (filter.jobRole) params = params.set('jobRole', filter.jobRole);

    return this.http.get<{ success: boolean; data: Attendance[] }>(`${this.apiUrl}/range`, { params });
  }
getAttendanceSummary(startDate?: string, endDate?: string): Observable<{ success: boolean; data: any[] }> {
  let params = new HttpParams();

  if (startDate) params = params.set('startDate', startDate);
  if (endDate) params = params.set('endDate', endDate);

  return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/summary`, { params });
}

// Admin force close attendance (forgot logout / emergency)
adminCloseAttendance(attendanceId: string, payload: {
  outTime: Date;
  reason: string;
}): Observable<{ success: boolean; data: Attendance }> {

  return this.http.put<{ success: boolean; data: Attendance }>(
    `${this.apiUrl}/admin-close/${attendanceId}`,
    payload
  );
}

exportAttendance(
  startDate: string,
  endDate: string,
  format: 'excel' | 'pdf',
  staffId?: string,
  jobRole?: string
): Observable<Blob> {

  let params = new HttpParams()
.set('startDate', startDate)
.set('endDate', endDate)

    .set('format', format);

  if (staffId) params = params.set('staffId', staffId);
  if (jobRole) params = params.set('jobRole', jobRole);

  return this.http.get(`${this.apiUrl}/export`, {
    params,
    responseType: 'blob'
  });
}

}