import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medicine } from '../models/medicine.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private apiUrl = `${environment.apiUrl}/medicines`;

  constructor(private http: HttpClient) {}

  // Create
  createMedicine(medicineData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, medicineData);
  }
getCategories() {
  return this.http.get(`${environment.apiUrl}/stock-categories`);
}
// In medicine.service.ts
getDoctorMedicines(): Observable<any> {
  return this.http.get(`${this.apiUrl}/doctor/medicines`);
}

  // Read - Get all
  getMedicines(page = 1, limit = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  // Read - Get by ID
  getMedicineById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
// Add this method
getAllItemsForIP(): Observable<any> {
  return this.http.get(`${this.apiUrl}/all-for-ip`);
}
  // Update
  updateMedicine(id: string, updates: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updates);
  }

  // Delete
  deleteMedicine(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Update stock
  updateStock(id: string, quantity: number, type: 'add' | 'subtract'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/stock`, { quantity, type });
  }

  // Search medicines
  searchMedicines(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?query=${query}`);
  }

  // Get low stock medicines
  getLowStockMedicines(): Observable<any> {
    return this.http.get(`${this.apiUrl}/low-stock`);
  }
  // Add this method to MedicineService class
getBillableItems(): Observable<any> {
  return this.http.get(`${this.apiUrl}/billable-items`);
}
// Add this method in MedicineService
addIPBillItems(data: any): Observable<any> {
  return this.http.post(`${environment.apiUrl}/ip-billing/items`, data);
}
  // Get available medicines (with stock > 0)
  getAvailableMedicines(): Observable<any> {
    return this.http.get(`${this.apiUrl}/available`);
  }
}