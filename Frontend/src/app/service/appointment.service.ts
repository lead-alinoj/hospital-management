import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Appointment {
  patientName: string;
  contactNumber: string;
  email: string;
  description: string;
   appointmentDate?: string | Date;   // ✅ ADD
    appointmentTime: string | null;          // ✅ ADD
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl =`${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  createAppointment(data: Appointment): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }
}
