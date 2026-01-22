import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Patient, 
  CreatePatientRequest, 
  PatientSearchResponse 
} from '../models/patient.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/patients`;

  createPatient(patientData: CreatePatientRequest): Observable<any> {
    return this.http.post(this.apiUrl, patientData);
  }

  searchPatients(query: string, page: number = 1, limit: number = 10): Observable<PatientSearchResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (query) {
      params = params.set('query', query);
    }

    return this.http.get<PatientSearchResponse>(`${this.apiUrl}/search`, { params });
  }
// Add this after updatePatient method
deletePatient(id: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`);
}

// Add this method for soft deactivate
deactivatePatient(id: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
}
  getPatientById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
getDoctors(): Observable<User[]> {
  return this.http.get<User[]>(`${this.apiUrl}/auth/users/doctors`);
}


  updatePatient(id: string, updates: Partial<Patient>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updates);
  }

  // Quick search for reception
  quickSearch(query: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/quick-search?query=${query}`);
  }

  // Get recent patients
  getRecentPatients(limit: number = 10): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/recent?limit=${limit}`);
  }
}