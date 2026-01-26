import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Vitals, RecordVitalsRequest } from '../models/vitals.model';

import { 
  Visit, 
  CreateVisitRequest, 
  TodayVisitsResponse 
} from '../models/visit.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/visits`;

// service/visit.service.ts - Update the getTodayVisits method
getTodayVisits(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/today`).pipe(
    catchError((error) => {
      console.error('Error fetching today visits:', error);
      // Return a structured error response
      return throwError(() => ({
        success: false,
        message: error.error?.message || 'Network error. Please try again.',
        error: error
      }));
    })
  );
}
updateVisit(id: string, updates: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}`, updates);
}

deleteVisit(visitId: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${visitId}`);
}
getDoctorConsultedPatients() {
  return this.http.get<any>(
    `${this.apiUrl}/doctor/consulted`
  );
}

createVisit(visitData: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}`, visitData).pipe(
    catchError((error) => {
      console.error('Error creating visit:', error);
      return throwError(() => error);
    })
  );
}

  getPendingVitals(): Observable<Visit[]> {
    return this.http.get<Visit[]>(`${this.apiUrl}/pending-vitals`);
  }

  getPendingConsultation(): Observable<Visit[]> {
    return this.http.get<Visit[]>(`${this.apiUrl}/pending-consultation`);
  }

  getVisitById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateVisitStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  getPatientVisits(patientId: string): Observable<Visit[]> {
    return this.http.get<Visit[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  // For reception dashboard
  getTodaysVisitsByStatus(status: string): Observable<Visit[]> {
    return this.http.get<Visit[]>(`${this.apiUrl}/today/${status}`);
  }

getDoctors(): Observable<User[]> {
  return this.http.get<User[]>(`${environment.apiUrl}/auth/users/doctors`);
}

getVisitWithVitals(visitId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/${visitId}/with-vitals`);
}
  // Move to next stage
  moveToNextStage(visitId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${visitId}/next-stage`, {});
  }
}