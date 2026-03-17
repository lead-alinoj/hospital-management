import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Doctor {
  _id?: string;
  name: string;
  specialty: string;
  experience: number;
  qualification: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/doctors`;

  constructor(private http: HttpClient) { }

  getDoctors(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getDoctor(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createDoctor(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  updateDoctor(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}