import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Payment {
  _id?: string;
  visitId: string;
  patientId: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  receivedBy: {
    userId: string;
    role: 'Reception' | 'Admin' | 'Pharmacy';
    name?: string;
  };
  remarks?: string;
  createdAt: Date;
}

export interface CreatePaymentRequest {
  visitId: string;
  patientId: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  remarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ip/payments`;

  // Get all payments for a visit
  getPayments(visitId: string): Observable<{success: boolean; data: Payment[]}> {
    return this.http.get<{success: boolean; data: Payment[]}>(`${this.apiUrl}/${visitId}`);
  }

  // Create new payment
  createPayment(paymentData: CreatePaymentRequest): Observable<{success: boolean; data: Payment}> {
    return this.http.post<{success: boolean; data: Payment}>(this.apiUrl, paymentData);
  }
}