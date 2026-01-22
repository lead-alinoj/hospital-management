import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Vitals, RecordVitalsRequest, UpdateVitalsRequest } from '../models/vitals.model';

@Injectable({
  providedIn: 'root'
})
export class VitalsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vitals`;

  recordVitals(vitalsData: RecordVitalsRequest): Observable<any> {
    return this.http.post(this.apiUrl, vitalsData);
  }

  getVitalsByVisit(visitId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/visit/${visitId}`);
  }

  getPatientVitalsHistory(patientId: string, page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get(`${this.apiUrl}/patient/${patientId}`, { params });
  }

updateVitals(id: string, updates: UpdateVitalsRequest): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}`, updates);
}

  softDeleteVitals(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }

  getAbnormalVitals(): Observable<any> {
    return this.http.get(`${this.apiUrl}/abnormal`);
  }

  getTodayStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/today`);
  }

  // Check for abnormal values
  checkAbnormalValues(vitals: any): { isAbnormal: boolean; alerts: string[] } {
    const alerts: string[] = [];

    // Blood Pressure
    if (vitals.bloodPressure?.systolic > 140 || vitals.bloodPressure?.diastolic > 90) {
      alerts.push('High Blood Pressure');
    }

    // Temperature
    if (vitals.temperature?.value > 37.5) {
      alerts.push('Fever');
    }

    // SpO2
    if (vitals.spo2?.value < 95) {
      alerts.push('Low Oxygen Saturation');
    }

    // Pulse
    if (vitals.pulse?.value) {
      if (vitals.pulse.value < 60 || vitals.pulse.value > 100) {
        alerts.push('Abnormal Pulse Rate');
      }
    }

    // Blood Sugar
    if (vitals.bloodSugar?.value) {
      if (vitals.bloodSugar.value < 70 || vitals.bloodSugar.value > 180) {
        alerts.push('Abnormal Blood Sugar');
      }
    }

    return {
      isAbnormal: alerts.length > 0,
      alerts
    };
  }

  // Get classification for values
  classifyBP(systolic: number, diastolic: number): string {
    if (systolic >= 180 || diastolic >= 120) return 'Hypertensive Crisis';
    if (systolic >= 140 || diastolic >= 90) return 'Stage 2 Hypertension';
    if (systolic >= 130 || diastolic >= 80) return 'Stage 1 Hypertension';
    if (systolic >= 120 || diastolic < 80) return 'Elevated';
    if (systolic < 120 && diastolic < 80) return 'Normal';
    return 'Unknown';
  }

  classifyBMI(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
recordNurseVitals(vitalsData: RecordVitalsRequest): Observable<any> {
  return this.http.post(`${this.apiUrl}/nurse`, vitalsData);
}
  // Get normal ranges for display
  getNormalRanges(): any {
    return {
      bloodPressure: { min: '90/60', max: '120/80', unit: 'mmHg' },
      temperature: { min: 36.1, max: 37.2, unit: '°C' },
      pulse: { min: 60, max: 100, unit: 'bpm' },
      spo2: { min: 95, max: 100, unit: '%' },
      respiratoryRate: { min: 12, max: 20, unit: 'breaths/min' },
      bloodSugar: {
        fasting: { min: 70, max: 100, unit: 'mg/dL' },
        random: { min: 70, max: 140, unit: 'mg/dL' }
      }
    };
  }
}