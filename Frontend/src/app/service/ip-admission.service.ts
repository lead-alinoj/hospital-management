import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Import models
import {
  BedAvailabilityResponse,
  CurrentIPPatientsResponse,
  EmergencyAdmissionRequest,
  DoctorAdvisedAdmissionRequest,
  DischargeRequest,
  CancelAdmissionRequest,
  IPAdmission,
  CareUnit,
  Bed,
  IPDashboardStats,
  PatientSummary,
  IPCharge,
  CreateIPChargeRequest,
  UpdateIPChargeRequest,
  IPChargeResponse
} from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class IpAdmissionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ip-admission`;

  // === Bed & Unit Management ===
  getBedAvailability(): Observable<BedAvailabilityResponse> {
    return this.http.get<BedAvailabilityResponse>(`${this.apiUrl}/beds/available`);
  }

  getAllCareUnits(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/care-units`);
  }

  getCareUnitById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/care-units/${id}`);
  }

  // === Admission Operations ===
  emergencyAdmission(data: EmergencyAdmissionRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/emergency`, data);
  }

  doctorAdvisedAdmission(data: DoctorAdvisedAdmissionRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/doctor-admit`, data);
  }

  cancelAdmission(data: CancelAdmissionRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cancel`, data);
  }

  dischargePatient(data: DischargeRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/discharge`, data);
  }
getAvailablePatients(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/patients/available`);
}
  // === Patient Management ===
  getCurrentIPPatients(): Observable<CurrentIPPatientsResponse> {
    return this.http.get<CurrentIPPatientsResponse>(`${this.apiUrl}/current`);
  }

  getIPPatientSummary(visitId: string): Observable<{ success: boolean; data: PatientSummary }> {
    return this.http.get<{ success: boolean; data: PatientSummary }>(
      `${this.apiUrl}/patient-summary/${visitId}`
    );
  }
getRecommendedIPPatients(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/recommended`);
}

  // === Dashboard ===
  getIPDashboardStats(): Observable<{ success: boolean; data: IPDashboardStats }> {
    return this.http.get<{ success: boolean; data: IPDashboardStats }>(
      `${this.apiUrl}/dashboard/stats`
    );
  }
// Doctor → Recommend IP (NO bed allocation)
recommendIpAdmission(data: {
  visitId: string;
  admissionNotes: string;
  admissionType: 'DOCTOR_ADVISED' | 'OBSERVATION';
}) {
  return this.http.post(
    `${this.apiUrl}/ip-admission/recommend`,
    data
  );
}

// Reception → Admit patient using recommendation
allocateRecommendedAdmission(data: {
  visitId: string;
  bedId: string;
  admissionNotes: string;
  expectedStayDays: number;
  admissionType: 'DOCTOR_ADVISED' | 'OBSERVATION';
  nursingInstructions?: string;
  specialRequirements?: any;
}) {
  return this.http.post(
    `${this.apiUrl}/ip-admission/allocate`,
    data
  );
}

  // === Charge Management ===
  addCharge(charge: CreateIPChargeRequest): Observable<IPChargeResponse> {
    return this.http.post<IPChargeResponse>(`${this.apiUrl}/charges`, charge);
  }

  getPatientCharges(visitId: string): Observable<IPChargeResponse> {
    return this.http.get<IPChargeResponse>(`${this.apiUrl}/charges/${visitId}`);
  }

  updateCharge(chargeId: string, updates: UpdateIPChargeRequest): Observable<IPChargeResponse> {
    return this.http.patch<IPChargeResponse>(`${this.apiUrl}/charges/${chargeId}`, updates);
  }

  deleteCharge(chargeId: string): Observable<IPChargeResponse> {
    return this.http.delete<IPChargeResponse>(`${this.apiUrl}/charges/${chargeId}`);
  }

  // === Transfer Operations ===
  transferBed(visitId: string, newBedId: string, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transfer`, {
      visitId,
      newBedId,
      reason
    });
  }

  // === Search & Filter ===
  searchIPPatients(query: string): Observable<CurrentIPPatientsResponse> {
    return this.http.get<CurrentIPPatientsResponse>(
      `${this.apiUrl}/search?query=${query}`
    );
  }

  getPatientsByStatus(status: 'IP_ACTIVE' | 'DISCHARGED'): Observable<CurrentIPPatientsResponse> {
    return this.http.get<CurrentIPPatientsResponse>(
      `${this.apiUrl}/status/${status}`
    );
  }

  // === Reports ===
  getAdmissionReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/reports/admissions?startDate=${startDate}&endDate=${endDate}`
    );
  }
// Add this method:
getAvailableVisits(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/available-visits`);
}
  getBedOccupancyReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/occupancy`);
  }
}