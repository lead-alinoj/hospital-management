import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BedResponse } from '../models/bed.model';

@Injectable({
  providedIn: 'root'
})
export class BedService {



  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bed`;

  getAllBeds(): Observable<BedResponse> {
    return this.http.get<BedResponse>(this.apiUrl);
  }

  getAvailableBeds(): Observable<BedResponse> {
    return this.http.get<BedResponse>(`${this.apiUrl}/available`);
  }

  getBedsByCareUnit(careUnitId: string): Observable<BedResponse> {
    return this.http.get<BedResponse>(`${this.apiUrl}?careUnit=${careUnitId}`);
  }

  allocateBed(bedId: string, patientId: string, visitId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${bedId}/allocate`, {
      patientId,
      visitId
    });
  }

dischargeBed(id: string) {
  return this.http.post(`${this.apiUrl}/${id}/discharge`, {});
}


  updateBed(bedId: string, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${bedId}`, payload);
  }
}
