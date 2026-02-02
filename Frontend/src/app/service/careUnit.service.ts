import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CareUnitResponse,
  CreateCareUnitRequest
} from '../models/careUnit.model';

@Injectable({
  providedIn: 'root'
})
export class CareUnitService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/care-units`;

  getAllCareUnits(): Observable<CareUnitResponse> {
    return this.http.get<CareUnitResponse>(this.apiUrl);
  }

  getCareUnitById(id: string): Observable<CareUnitResponse> {
    return this.http.get<CareUnitResponse>(`${this.apiUrl}/${id}`);
  }

  createCareUnit(payload: CreateCareUnitRequest): Observable<CareUnitResponse> {
    return this.http.post<CareUnitResponse>(this.apiUrl, payload);
  }

  updateCareUnit(id: string, payload: any): Observable<CareUnitResponse> {
    return this.http.put<CareUnitResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deactivateCareUnit(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
