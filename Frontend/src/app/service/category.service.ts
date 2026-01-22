import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  // Get all categories
  getCategories(): Observable<{ success: boolean, data: Category[] }> {
    return this.http.get<{ success: boolean, data: Category[] }>(this.apiUrl);
  }

  // Get category by ID
  getCategoryById(id: string): Observable<{ success: boolean, data: Category }> {
    return this.http.get<{ success: boolean, data: Category }>(`${this.apiUrl}/${id}`);
  }

  // Create new category
  createCategory(category: Category): Observable<{ success: boolean, data: Category }> {
    return this.http.post<{ success: boolean, data: Category }>(this.apiUrl, category);
  }

  // Update category
  updateCategory(id: string, category: Partial<Category>): Observable<{ success: boolean, data: Category }> {
    return this.http.put<{ success: boolean, data: Category }>(`${this.apiUrl}/${id}`, category);
  }

  // Delete category
  deleteCategory(id: string): Observable<{ success: boolean, message: string }> {
    return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${id}`);
  }
}
