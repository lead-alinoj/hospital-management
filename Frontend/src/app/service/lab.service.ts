import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LabResult, CreateLabResultRequest, LabTestTemplate } from '../models/lab.model';

@Injectable({
  providedIn: 'root'
})
export class LabService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/lab`;

  createLabResult(labData: CreateLabResultRequest): Observable<any> {
    return this.http.post(this.apiUrl, labData);
  }

  createBatchLabResults(labResults: CreateLabResultRequest[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/batch`, { results: labResults });
  }

  getLabResultsByVisit(visitId: string): Observable<LabResult[]> {
    return this.http.get<LabResult[]>(`${this.apiUrl}/visit/${visitId}`);
  }

  getPatientLabHistory(patientId: string): Observable<LabResult[]> {
    return this.http.get<LabResult[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  updateLabStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  verifyLabResult(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/verify`, {});
  }

  // Get common lab test templates
  getCommonLabTests(): LabTestTemplate[] {
    return [
      {
        code: 'CBC',
        name: 'Complete Blood Count',
        category: 'Blood',
        subCategory: 'CBC',
        resultType: 'Numeric',
        referenceRange: { text: 'See individual parameters' }
      },
      {
        code: 'RBS',
        name: 'Random Blood Sugar',
        category: 'Blood',
        subCategory: 'Biochemistry',
        unit: 'mg/dL',
        resultType: 'Numeric',
        referenceRange: { low: 70, high: 140 }
      },
      {
        code: 'FBS',
        name: 'Fasting Blood Sugar',
        category: 'Blood',
        subCategory: 'Biochemistry',
        unit: 'mg/dL',
        resultType: 'Numeric',
        referenceRange: { low: 70, high: 100 }
      },
      {
        code: 'URINE_R',
        name: 'Urine Routine',
        category: 'Urine',
        resultType: 'Text',
        referenceRange: { text: 'Normal' }
      }
    ];
  }
}