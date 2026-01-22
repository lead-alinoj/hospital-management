import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Hospital, HospitalUpdateRequest } from '../models/hospital.model';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hospital`;

  getHospital(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  updateHospital(updates: HospitalUpdateRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}`, updates);
  }

  uploadLogo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post(`${this.apiUrl}/logo`, formData);
  }

  getLogo(): string {
    return `${environment.apiUrl}/hospital/logo`;
  }

  getLetterheadInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/letterhead`);
  }
}