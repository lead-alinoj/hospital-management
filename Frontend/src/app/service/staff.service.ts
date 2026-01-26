import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Staff, CreateStaffDto, UpdateStaffDto } from '../models/staff.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = `${environment.apiUrl}/staff`;

  constructor(private http: HttpClient) {}

  // Create new staff
  createStaff(staffData: CreateStaffDto): Observable<{ success: boolean; data: Staff; message: string }> {
    return this.http.post<{ success: boolean; data: Staff; message: string }>(this.apiUrl, staffData);
  }

  // Get all staff
  getAllStaff(filters?: { role?: string; status?: string }): Observable<{ success: boolean; data: Staff[]; count: number }> {
    let params = new HttpParams();
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.status) params = params.set('status', filters.status);

    return this.http.get<{ success: boolean; data: Staff[]; count: number }>(this.apiUrl, { params });
  }

  // Get active staff
  getActiveStaff(): Observable<{ success: boolean; data: Staff[] }> {
    return this.http.get<{ success: boolean; data: Staff[] }>(`${this.apiUrl}/active`);
  }

  // Get staff by ID
  getStaffById(id: string): Observable<{ success: boolean; data: Staff }> {
    return this.http.get<{ success: boolean; data: Staff }>(`${this.apiUrl}/${id}`);
  }

  // Update staff
  updateStaff(id: string, staffData: UpdateStaffDto): Observable<{ success: boolean; data: Staff; message: string }> {
    return this.http.put<{ success: boolean; data: Staff; message: string }>(`${this.apiUrl}/${id}`, staffData);
  }

  // Delete staff
  deleteStaff(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Search staff
  searchStaff(query: string): Observable<{ success: boolean; data: Staff[] }> {
    return this.http.get<{ success: boolean; data: Staff[] }>(`${this.apiUrl}/search/${query}`);
  }

  // Get staff by role
  getStaffByRole(role: string): Observable<{ success: boolean; data: Staff[] }> {
    return this.http.get<{ success: boolean; data: Staff[] }>(`${this.apiUrl}/role/${role}`);
  }
}