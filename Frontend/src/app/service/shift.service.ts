import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shift } from '../models/shift.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ShiftService {
  private apiUrl = `${environment.apiUrl}/shifts`;

  constructor(private http: HttpClient) {}

  getShifts(): Observable<{ success: boolean; data: Shift[] }> {
    return this.http.get<{ success: boolean; data: Shift[] }>(
      `${this.apiUrl}/list`
    );
  }

  createShift(data: Shift) {
    return this.http.post(`${this.apiUrl}/create`, data);
  }

updateShift(id: string, data: Shift) {
  return this.http.put(`${this.apiUrl}/update/${id}`, data);
}

deactivateShift(id: string) {
  return this.http.delete(`${this.apiUrl}/deactivate/${id}`);
}

}