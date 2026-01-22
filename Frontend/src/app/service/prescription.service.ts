import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/prescriptions`;

  // Create new prescription
  createPrescription(prescriptionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, prescriptionData);
  }

  // Get prescription by ID
  getPrescriptionById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Get prescription by visit ID
  getPrescriptionByVisit(visitId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/visit/${visitId}`);
  }
getPrescriptionWithDetails(id: string) {
  return this.http.get<any>(`${this.apiUrl}/${id}/details`);
}

  // Get patient history
  getPatientHistory(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}/history`);
  }

  // Get patient prescriptions
  getPatientPrescriptions(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}`);
  }

  // Get prescriptions for pharmacy with status filter
  getPrescriptionsForPharmacy(status: string = 'Active'): Observable<any> {
    let params = new HttpParams();
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get(`${this.apiUrl}/pharmacy`, { params });
  }

  // Get today's dispensed prescriptions
  getTodaysDispensed(): Observable<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const params = new HttpParams()
      .set('status', 'Completed')
      .set('fromDate', today.toISOString());
    
    return this.http.get(`${this.apiUrl}/pharmacy`, { params });
  }

  // Mark prescription as dispensed
  markAsDispensed(dispenseData: any): Observable<any> {
    const { prescriptionId, ...paymentData } = dispenseData;
    return this.http.patch(`${this.apiUrl}/${prescriptionId}/dispense`, paymentData);
  }

  // Update prescription status
  updatePrescriptionStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  // Generate prescription ID (utility method)
  generatePrescriptionId(): string {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RX${year}${month}${day}${random}`;
  }
}