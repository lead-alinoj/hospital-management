import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Medicine } from '../models/medicine.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private apiUrl = `${environment.apiUrl}/medicines`;

  constructor(private http: HttpClient) {}
  
// Add a method to check user permissions
checkUserPermissions(): Observable<any> {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return of({
    canAddBills: ['Doctor', 'Nurse', 'Pharmacy', 'Reception', 'Admin'].includes(user.role),
    role: user.role
  });
}
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
   // Get available medicines (with stock > 0)
  getAvailableMedicines(): Observable<any> {
    return this.http.get(`${this.apiUrl}/available`);
  }
  // Add this method to MedicineService class
getBillableItems(): Observable<any> {
  return this.http.get(`${this.apiUrl}/billable-items`);
}
// Change this method in medicine.service.ts
addIPBillItems(data: any): Observable<any> {
  return this.http.post(`${environment.apiUrl}/ipbill/items`, data); // ✅ Correct endpoint
}
 // Delete IP bill item
deleteBillItem(itemId: string): Observable<any> {
  return this.http.delete(`${environment.apiUrl}/ipbill/items/${itemId}`);
}
addManualBillItem(data: any): Observable<any> {
  // Prepare data with defaults
  const serviceItemData = {
    ...data,
    administeredBy: data.administeredBy || 'System',
    billGroup: 'SERVICE',
    quantity: data.quantity || 1,
    unitPrice: data.unitPrice || (data.amount / (data.quantity || 1)),
    totalPrice: data.totalPrice || data.amount,
    categoryType: this.mapCategoryToValidEnum(data.categoryType || 'OTHER')
  };
  
  console.log('📤 Sending manual bill item:', serviceItemData);
  
  return this.http.post(`${environment.apiUrl}/ipbill/manual-item`, serviceItemData);
}

// Helper method to map category to valid enum value
private mapCategoryToValidEnum(category: string): string {
  if (!category) return 'OTHER';
  
  const categoryMap: {[key: string]: string} = {
    'ROOM': 'ROOM',
    'NURSING': 'NURSING',
    'DOCTOR': 'DOCTOR',
    'CONSULTATION': 'DOCTOR',
    'PROCEDURE': 'PROCEDURE',
    'LAB': 'LAB',
    'OTHER': 'OTHER',
    'Medicine': 'Medicine',
    'Consumable': 'Consumable'
  };
  
  return categoryMap[category] || 'OTHER';
}
getReceptionItems(): Observable<any> {
    return this.http.get(`${this.apiUrl}/medicines/reception-ip`);
  }
markBillItemsAsBilled(visitId: string, paymentData: any): Observable<any> {
  return this.http.post(`${environment.apiUrl}/ipbill/mark-billed/${visitId}`, paymentData);
}
updateBillItem(itemId: string, data: any): Observable<any> {
  return this.http.put(`${environment.apiUrl}/ipbill/items/${itemId}`, data);
}
// Add this method in MedicineService class
getIPBillItems(visitId: string): Observable<any> {
  return this.http.get(`${environment.apiUrl}/ipbill/items/${visitId}`);
}
// Calculate IP bill
calculateIPBill(visitId: string): Observable<any> {
  return this.http.get(`${environment.apiUrl}/ipbill/calculate/${visitId}`);
}
getIPServiceItems(visitId: string): Observable<any> {
  return this.http.get<any>(`${environment.apiUrl}/ipbill/service-items/${visitId}`);
}
getNearExpiryMedicines(): Observable<any> {
  return this.http.get(`${this.apiUrl}/near-expiry`);
}

getExpiredMedicines(): Observable<any> {
  return this.http.get(`${this.apiUrl}/expired`);
}

// Mark service items as billed - CORRECTED ENDPOINT
markServiceBillItemsAsBilled(visitId: string, itemIds: string[], paymentData: any): Observable<any> {
  return this.http.post<any>(`${environment.apiUrl}/ipbill/mark-service-billed`, {
    visitId,
    itemIds,
    paymentData
  });
}
}