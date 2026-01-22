import { Category } from "./category.model";

export interface Medicine {
  _id?: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  unit: string; // mg, ml, etc.
  category: Category;
  stockQty: number;
  minStock: number;
  price: number;
  expiryDate?: Date;
  batchNumber?: string;
  supplier?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMedicineRequest {
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  unit: string;
category?: string;


  stockQty: number;
  minStock: number;
  price: number;
  expiryDate?: Date;
  batchNumber?: string;
  supplier?: string;
}

export interface UpdateMedicineRequest {
  name?: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  unit?: string;
  category?: string;
  stockQty?: number;
  minStock?: number;
  price?: number;
  expiryDate?: Date;
  batchNumber?: string;
  supplier?: string;
  isActive?: boolean;
}

export interface MedicineSearchResponse {
  success: boolean;
  data: Medicine[];
  total: number;
  page: number;
  pages: number;
}

export interface LowStockAlert {
  medicine: Medicine;
  currentStock: number;
  minStock: number;
  isCritical: boolean;
}