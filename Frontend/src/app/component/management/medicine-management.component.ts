import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MedicineService } from '../../service/medicine.service';
import { Medicine } from '../../models/medicine.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { StockUpdateDialogComponent } from './StockUpdateDialogComponent';
import { CategoryService } from '../../service/category.service';

@Component({
  selector: 'app-medicine-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDatepickerModule
  ],
  template: `
<div class="medicine-management">
  <div class="header-section">
    <h1>
      <mat-icon>medication</mat-icon>
      Medicine Stock Management
    </h1>
    <button mat-raised-button color="primary" (click)="toggleAddForm()">
      <mat-icon>{{ showAddForm ? 'close' : 'add' }}</mat-icon>
      {{ showAddForm ? 'Cancel' : 'Add New Medicine' }}
    </button>
  </div>

  <!-- Inline Add/Edit Medicine Form -->
  <mat-card *ngIf="showAddForm" class="add-medicine-form">
    <mat-card-header>
      <mat-card-title>
        {{ isEditing ? 'Edit Medicine' : 'Add New Medicine' }}
      </mat-card-title>
    </mat-card-header>

    <mat-card-content>
      <form [formGroup]="medicineForm">
        <div class="form-grid">

          <!-- Row 1: Name & Generic Name -->
          <div class="row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Medicine Name *</mat-label>
  <mat-icon matPrefix>medical_services</mat-icon>

              <input matInput formControlName="name" placeholder="e.g., Paracetamol">
              <mat-error *ngIf="medicineForm.get('name')?.hasError('required')">
                Name is required
              </mat-error>
            </mat-form-field>

<mat-form-field *ngIf="isMedicine" appearance="outline">
  <!-- Generic Name -->
<mat-icon matPrefix>science</mat-icon>

  <mat-label>Generic Name</mat-label>
  <input matInput formControlName="genericName">
</mat-form-field>

          </div>

          <!-- Row 2: Brand, Strength, Unit -->
          <div class="row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-icon matPrefix>branding_watermark</mat-icon>

            <mat-label>Brand Name</mat-label>
              <input matInput formControlName="brandName" placeholder="e.g., Crocin">
            </mat-form-field>

<mat-form-field *ngIf="isMedicine" appearance="outline">
  <mat-icon matPrefix>fitness_center</mat-icon>

  <mat-label>Strength *</mat-label>
  <input matInput formControlName="strength">
</mat-form-field>


<mat-form-field
  *ngIf="isMedicine || isConsumable || isCleaning"
  appearance="outline"
  class="quarter-width">
<mat-icon matPrefix>straighten</mat-icon>

  <mat-label>Unit *</mat-label>
  <mat-select formControlName="unit">

    <!-- Medicine units -->
    <mat-option value="mg">mg</mat-option>
    <mat-option value="ml">ml</mat-option>
    <mat-option value="g">g</mat-option>
    <mat-option value="mcg">mcg</mat-option>
    <mat-option value="IU">IU</mat-option>

    <!-- Non-medicine consumables -->
    <mat-option value="piece">piece</mat-option>
    <mat-option value="pack">pack</mat-option>
    <mat-option value="box">box</mat-option>
    <mat-option value="roll">roll</mat-option>

  </mat-select>
</mat-form-field>


          </div>

          <!-- Row 3: Category & Supplier -->
          <div class="row">
   <mat-form-field appearance="outline">
      <mat-icon matPrefix>category</mat-icon>

  <mat-label>Category</mat-label>
<mat-select formControlName="category"
  (selectionChange)="categoryChanged($event.value)">
    <mat-option *ngFor="let cat of categories" [value]="cat._id">
      {{ cat.name }}
    </mat-option>
  </mat-select>
</mat-form-field>


<mat-form-field *ngIf="!isEquipment || isEquipment"  appearance="outline">
<mat-icon matPrefix>local_shipping</mat-icon>

  <mat-label>Supplier</mat-label>
  <input matInput formControlName="supplier">
</mat-form-field>

          </div>

          <!-- Row 4: Current Stock, Min Stock, Price (Min Stock & Price for Consumables only) -->
          <div class="row">
            <mat-form-field appearance="outline" class="third-width">
              <mat-icon matPrefix>inventory</mat-icon>
  
            <mat-label>Current Stock *</mat-label>
              <input matInput formControlName="stockQty" type="number" min="0">
              <mat-error *ngIf="medicineForm.get('stockQty')?.hasError('required')">
                Stock quantity is required
              </mat-error>
            </mat-form-field>

<mat-form-field *ngIf="!isEquipment">
  <mat-icon matPrefix>warning_amber</mat-icon>

              <mat-label>Min Stock *</mat-label>
              <input matInput formControlName="minStock" type="number" min="0">
              <mat-error *ngIf="medicineForm.get('minStock')?.hasError('required')">
                Minimum stock is required
              </mat-error>
            </mat-form-field>

<mat-form-field *ngIf="isMedicine || isConsumable || isCleaning">
  <mat-icon matPrefix>currency_rupee</mat-icon>
            
<mat-label>Price (₹) *</mat-label>
              <input matInput formControlName="price" type="number" step="0.01" min="0">
              <mat-error *ngIf="medicineForm.get('price')?.hasError('required')">
                Price is required
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Row 5: Batch Number & Expiry Date  -->
<div *ngIf="isMedicine || isConsumable">
            <mat-form-field appearance="outline" class="half-width">
             <mat-icon matPrefix>qr_code</mat-icon>
 
            <mat-label>Batch Number</mat-label>
              <input matInput formControlName="batchNumber" placeholder="e.g., BATCH-2024-001">
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
            <mat-icon matPrefix>event</mat-icon>
  
            <mat-label>Expiry Date</mat-label>
              <input matInput [matDatepicker]="expiryPicker" formControlName="expiryDate">
              <mat-datepicker-toggle matSuffix [for]="expiryPicker"></mat-datepicker-toggle>
              <mat-datepicker #expiryPicker></mat-datepicker>
            </mat-form-field>
          </div>

        </div>
      </form>
    </mat-card-content>

    <mat-card-actions align="end">
      <button mat-button (click)="cancelForm()">Cancel</button>
      <button mat-raised-button color="primary" 
        [disabled]="medicineForm.invalid || isLoading"
        (click)="saveMedicine()">
        {{ isEditing ? 'Update' : 'Save' }}
      </button>
    </mat-card-actions>
  </mat-card>
</div>


      <!-- Statistics Cards -->
      <div class="stats-cards">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon color="primary">inventory</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ totalMedicines }}</span>
                <span class="stat-label">Total Medicines</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon color="accent">local_pharmacy</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ inStockCount }}</span>
                <span class="stat-label">In Stock</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon color="warn">warning</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ lowStockCount }}</span>
                <span class="stat-label">Low Stock</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
<mat-card class="stat-card">
  <mat-card-content>
    <div class="stat-content">
      <mat-icon color="accent">event</mat-icon>
      <div class="stat-details">
        <span class="stat-value">{{ nearExpiryCount }}</span>
        <span class="stat-label">Near Expiry</span>
      </div>
    </div>
  </mat-card-content>
</mat-card>

<mat-card class="stat-card">
  <mat-card-content>
    <div class="stat-content">
      <mat-icon color="warn">event_busy</mat-icon>
      <div class="stat-details">
        <span class="stat-value">{{ expiredCount }}</span>
        <span class="stat-label">Expired</span>
      </div>
    </div>
  </mat-card-content>
</mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon color="warn">block</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ outOfStockCount }}</span>
                <span class="stat-label">Out of Stock</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Search & Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-grid">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search Medicines</mat-label>
              <input matInput [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" 
                placeholder="Search by name, generic name, or brand">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [(value)]="selectedCategory" (selectionChange)="applyFilter()">
                <mat-option value="">All Categories</mat-option>
              <mat-option *ngFor="let cat of categories" [value]="cat._id">
  {{ cat.name }}
</mat-option>

              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Stock Status</mat-label>
              <mat-select [(value)]="selectedStockStatus" (selectionChange)="applyFilter()">
                <mat-option value="">All</mat-option>
                <mat-option value="in_stock">In Stock</mat-option>
                <mat-option value="low_stock">Low Stock</mat-option>
                <mat-option value="out_of_stock">Out of Stock</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-button color="primary" (click)="clearFilters()">
              <mat-icon>clear_all</mat-icon>
              Clear Filters
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Medicines Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z1">
              
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Medicine Name</th>
                <td mat-cell *matCellDef="let medicine">
                  <div class="medicine-name-cell">
                    <span class="medicine-name">{{ medicine.name }}</span>
                    <div class="medicine-details">
                      <span class="generic-name" *ngIf="medicine.genericName">
                        ({{ medicine.genericName }})
                      </span>
                      <span class="strength">{{ medicine.strength }} {{ medicine.unit }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Category Column -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
                <td mat-cell *matCellDef="let medicine">
<mat-chip>{{ medicine.category?.name }}</mat-chip>
                </td>
              </ng-container>

              <!-- Stock Column -->
              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Stock</th>
                <td mat-cell *matCellDef="let medicine">
                  <div class="stock-cell" [ngClass]="getStockClass(medicine)">
                    <span class="stock-value">{{ medicine.stockQty }}</span>
                    <span class="stock-min">min: {{ medicine.minStock }}</span>
                    <mat-icon *ngIf="medicine.stockQty <= medicine.minStock && medicine.stockQty > 0"
                      matTooltip="Low stock warning">warning</mat-icon>
                    <mat-icon *ngIf="medicine.stockQty === 0"
                      matTooltip="Out of stock">block</mat-icon>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="expiry">
  <th mat-header-cell *matHeaderCellDef mat-sort-header>Expiry</th>
  <td mat-cell *matCellDef="let medicine">
    <div class="expiry-cell">
      <span>{{ medicine.expiryDate | date:'dd MMM yyyy' }}</span>

      <span
        *ngIf="getExpiryStatus(medicine) === 'expired'"
        class="expiry-badge expired">
        Expired
      </span>

      <span
        *ngIf="getExpiryStatus(medicine) === 'near'"
        class="expiry-badge near">
        Near Expiry
      </span>

      <span
        *ngIf="getExpiryStatus(medicine) === 'valid'"
        class="expiry-badge valid">
        Valid
      </span>
    </div>
  </td>
</ng-container>

              <!-- Price Column -->
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Price (₹)</th>
                <td mat-cell *matCellDef="let medicine">
                  {{ medicine.price | number:'1.2-2' }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let medicine">
                  <span class="status-badge" [ngClass]="medicine.isActive ? 'active' : 'inactive'">
                    {{ medicine.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let medicine">
                  <div class="action-buttons">
                    <button mat-icon-button color="primary" 
                      [matTooltip]="'Edit ' + medicine.name"
                      (click)="editMedicine(medicine)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    
                    <button mat-icon-button color="accent" 
                      [matTooltip]="'Update stock for ' + medicine.name"
                      (click)="openStockUpdateDialog(medicine)">
                      <mat-icon>inventory</mat-icon>
                    </button>
                    
                    <button mat-icon-button color="warn" 
                      [matTooltip]="(medicine.isActive ? 'Deactivate' : 'Activate') + ' ' + medicine.name"
                      (click)="toggleMedicineStatus(medicine)">
                      <mat-icon>{{ medicine.isActive ? 'toggle_off' : 'toggle_on' }}</mat-icon>
                    </button>
                    
                    <button mat-icon-button color="warn" 
                      [matTooltip]="'Delete ' + medicine.name"
                      (click)="deleteMedicine(medicine._id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" 
              showFirstLastButtons
              aria-label="Select page of medicines">
            </mat-paginator>

            <!-- Empty State -->
            <div *ngIf="dataSource.filteredData.length === 0" class="empty-state">
              <mat-icon>inventory_2</mat-icon>
              <p>No medicines found</p>
              <button mat-raised-button color="primary" (click)="openAddMedicineDialog()">
                Add Your First Medicine
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Low Stock Alerts -->
      <mat-card *ngIf="lowStockMedicines.length > 0" class="alerts-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="warn">warning</mat-icon>
            Low Stock Alerts
          </mat-card-title>
          <mat-card-subtitle>
            These medicines are running low. Please reorder soon.
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="alerts-grid">
            <div *ngFor="let alert of lowStockMedicines" class="alert-item">
              <div class="alert-details">
                <span class="alert-medicine">{{ alert.medicine.name }}</span>
                <span class="alert-stock">
                  Stock: {{ alert.currentStock }} | Min: {{ alert.minStock }}
                </span>
              </div>
              <button mat-button color="primary" (click)="openStockUpdateDialog(alert.medicine)">
                Update Stock
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    
  `,
  styles: [`
    .medicine-management {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
 background: linear-gradient(
    180deg,
    #f4f9ff 0%,
    #edf4ff 40%,
    #f7fbff 100%
  );  color: #10233d;  
    }
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-section h1 {
    color: #0f3d8c;

  flex: 1 1 auto;
  min-width: 200px;
  margin: 0;
}

.header-section button {
  flex-shrink: 0;
  white-space: nowrap;
}
mat-card {
  background: linear-gradient(180deg, #ffffff, #f6faff);
  border: 1px solid #e3efff;
}
/* Dark blue icons inside Add Medicine form */
.add-medicine-form mat-icon[matPrefix] {
  color: #1e40af;        /* dark blue */
  opacity: 0.95;
}

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
   /* Base stat card */
.stat-card {
  text-align: center;
  border-radius: 14px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

/* 1️⃣ Total Medicines – soft blue (slightly darker) */
.stats-cards mat-card:nth-child(1) {
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border: 1px solid #bfdbfe;
}

/* 2️⃣ In Stock – soft green */
.stats-cards mat-card:nth-child(2) {
  background: linear-gradient(135deg, #dcfce7, #f0fdf4);
  border: 1px solid #86efac;
}

/* 3️⃣ Low Stock – soft amber */
.stats-cards mat-card:nth-child(3) {
  background: linear-gradient(135deg, #ffedd5, #fff7ed);
  border: 1px solid #fdba74;
}

/* 4️⃣ Out of Stock – soft rose */
.stats-cards mat-card:nth-child(4) {
  background: linear-gradient(135deg, #fee2e2, #fff1f2);
  border: 1px solid #fca5a5;
}
/* 5️⃣ Near Expiry – yellow */
.stats-cards mat-card:nth-child(5) {
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
  border: 1px solid #fde68a;
}
.stats-cards mat-card:nth-child(5) mat-icon {
  color: #d97706;
}

/* 6️⃣ Expired – deep red */
.stats-cards mat-card:nth-child(6) {
  background: linear-gradient(135deg, #fee2e2, #fff1f2);
  border: 1px solid #fecaca;
}
.stats-cards mat-card:nth-child(6) mat-icon {
  color: #b91c1c;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 32px rgba(30, 64, 175, 0.12);
}
/* Icon tone sync */
.stats-cards mat-card:nth-child(1) mat-icon { color: #2563eb; } /* blue */
.stats-cards mat-card:nth-child(2) mat-icon { color: #16a34a; } /* green */
.stats-cards mat-card:nth-child(3) mat-icon { color: #ea580c; } /* orange */
.stats-cards mat-card:nth-child(4) mat-icon { color: #dc2626; } /* red */

    .stat-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .stat-content mat-icon {
      font-size: 40px;
      height: 40px;
      width: 40px;
    }
    .stat-details {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    .filters-card {
        background: #f8fbff;
  border: 1px solid #e3efff;

      margin-bottom: 30px;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      align-items: center;
    }
    .search-field {
      grid-column: 1 / -1;
    }
    @media (min-width: 768px) {
      .search-field {
        grid-column: span 2;
      }
    }
    .table-card {
        background: linear-gradient(180deg, #ffffff, #f9fcff);

      margin-bottom: 30px;
    }
    .table-container {
      overflow-x: auto;
    }
    tr.mat-row:hover {
  background: #f1f7ff;
}

    th {
  background: #eef5ff;
  color: #1e3a8a;
}

    .medicine-name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .medicine-name {
      font-weight: 500;
    }
    .medicine-details {
      display: flex;
      gap: 10px;
      font-size: 12px;
      color: #666;
    }
    mat-chip {
  background: #e0edff !important;
  color: #1e40af !important;
  font-weight: 500;
}
.expiry-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.expiry-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  width: fit-content;
  font-weight: 600;
}

.expiry-badge.valid {
  background: #dcfce7;
  color: #166534;
}

.expiry-badge.near {
  background: #fef3c7;
  color: #92400e;
}

.expiry-badge.expired {
  background: #fee2e2;
  color: #991b1b;
}

    /* Add to medicine-management.component.css */
.add-medicine-form {
  margin-bottom: 30px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-grid {
  padding: 10px 0;
}

.row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.half-width { width: calc(50% - 10px); }
.quarter-width { width: calc(25% - 15px); }
.third-width { width: calc(33.33% - 13.33px); }

@media (max-width: 768px) {
  .row {
    flex-direction: column;
  }
  .half-width, .quarter-width, .third-width {
    width: 100%;
  }
}
    .stock-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .stock-cell.in-stock {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .stock-cell.low-stock {
      background: #fff3e0;
      color: #f57c00;
    }
    .stock-cell.out-of-stock {
      background: #ffebee;
      color: #c62828;
    }
    .stock-value {
      font-weight: bold;
      font-size: 16px;
    }
    .stock-min {
      font-size: 12px;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
.status-badge.active {
  background: #e6f4ea;
  color: #1b5e20;
}

.status-badge.inactive {
  background: #fdecec;
  color: #b91c1c;
}

    .action-buttons {
      display: flex;
      gap: 4px;
    }
    .empty-state {
      text-align: center;
      padding: 50px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 20px;
      color: #ddd;
    }
    .alerts-card {
      margin-top: 30px;
    }
    .alerts-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .alert-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ff9800;
    }
    .alert-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .alert-medicine {
      font-weight: 500;
      color: #856404;
    }
    .alert-stock {
      font-size: 14px;
      color: #856404;
    }
    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
    }
  `]
})
export class MedicineManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private medicineService = inject(MedicineService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
private categoryService = inject(CategoryService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Medicine>();
  displayedColumns: string[] = ['name', 'category', 'stock', 'expiry', 'price', 'status', 'actions'];

  medicineForm!: FormGroup;
  stockForm!: FormGroup;
  showAddForm = false;
  selectedMedicineId: string | null = null;
  totalMedicines = 0;
  inStockCount = 0;
  lowStockCount = 0;
  outOfStockCount = 0;
  nearExpiryCount = 0;
expiredCount = 0;

nearExpiryMedicines: Medicine[] = [];
expiredMedicines: Medicine[] = [];

  lowStockMedicines: any[] = [];

  
  searchTerm = '';
    selectedCategory: string = ''; // <-- ADD THIS

selectedCategoryType:
  | 'Medicine'
  | 'Consumable'
  | 'Cleaning'
  | 'Equipment'
  | null = null;
  categories: any[] = [];
  
selectedStockStatus = '';
  
  selectedMedicine: Medicine | null = null;
  isEditing = false;
  isLoading = false;

  ngOnInit(): void {
    this.initForms();
    this.loadMedicines();
     this.loadCategories();
    this.loadLowStockAlerts();
     this.loadNearExpiryMedicines();
  this.loadExpiredMedicines();

  }

  private initForms(): void {
    this.medicineForm = this.fb.group({
  name: ['', Validators.required],
  genericName: [{ value: '', disabled: true }],
  brandName: [''],
  strength: [{ value: '', disabled: true }],
  unit: [{ value: '', disabled: true }],
  category: ['', Validators.required],
  stockQty: [0, Validators.required],
  minStock: [{ value: '', disabled: true }],
  price: [{ value: '', disabled: true }],
  expiryDate: [{ value: '', disabled: true }],
  batchNumber: [{ value: '', disabled: true }],
  supplier: [{ value: '', disabled: true }],
  isActive: [true]
});


    this.stockForm = this.fb.group({
      type: ['add', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['']
    });
  }
onCategoryChange(category: any) {
  this.selectedCategoryType = category.type;

  // reset everything first
  this.disableAndClear([
    'genericName',
    'strength',
    'unit',
    'minStock',
    'price',
    'expiryDate',
    'batchNumber',
    'supplier'
  ]);

  // MEDICINE
  if (category.type === 'Medicine') {
    this.enableAndRequire([
      'genericName',
      'strength',
      'unit',
      'minStock',
      'price'
    ]);

    this.enableOnly([
      'expiryDate',
      'batchNumber',
      'supplier'
    ]);
  }

  // CONSUMABLE
  if (category.type === 'Consumable') {
    this.enableAndRequire([
      'unit',
      'minStock',
      'price'
    ]);

    this.enableOnly([
      'supplier',
      'expiryDate',
      'batchNumber'
    ]);
  }

  // CLEANING
  if (category.type === 'Cleaning') {
    this.enableAndRequire([
      'unit',
      'minStock'
    ]);

    this.enableOnly([
      'supplier',
      'price'
    ]);
  }

  // EQUIPMENT
  if (category.type === 'Equipment') {
    this.enableOnly([
      'supplier'
    ]);
  }
}


enableOnly(fields: string[]) {
  fields.forEach(f => {
    const control = this.medicineForm.get(f);
    control?.enable();
    control?.clearValidators();
    control?.updateValueAndValidity();
  });
}

enableAndRequire(fields: string[]) {
  fields.forEach(f => {
    const control = this.medicineForm.get(f);
    control?.enable();
    control?.setValidators(Validators.required);
    control?.updateValueAndValidity();
  });
}

disableAndClear(fields: string[]) {
  fields.forEach(f => {
    const control = this.medicineForm.get(f);
    control?.reset();
    control?.clearValidators();
    control?.disable();
    control?.updateValueAndValidity();
  });
}

loadCategories() {
  this.categoryService.getCategories().subscribe({
    next: (res: any) => {
      this.categories = res.data || [];
    },
    error: (err) => {
      console.error('Failed to load categories', err);
    }
  });
}

get isMedicine() {
  return this.selectedCategoryType === 'Medicine';
}

get isConsumable() {
  return this.selectedCategoryType === 'Consumable';
}

get isCleaning() {
  return this.selectedCategoryType === 'Cleaning';
}

get isEquipment() {
  return this.selectedCategoryType === 'Equipment';
}

  private loadMedicines(): void {
    this.isLoading = true;
    
    this.medicineService.getMedicines().subscribe({
      next: (response) => {
        if (response.success) {
          this.dataSource.data = response.data || [];
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          
          this.updateStatistics();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading medicines:', error);
        this.showError('Failed to load medicines');
        this.isLoading = false;
      }
    });
  }

  private loadLowStockAlerts(): void {
    this.medicineService.getLowStockMedicines().subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.lowStockMedicines = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading low stock alerts:', error);
      }
    });
  }

  private updateStatistics(): void {
    const medicines = this.dataSource.data;
    this.totalMedicines = medicines.length;
    
    this.inStockCount = medicines.filter(m => m.stockQty > m.minStock).length;
    this.lowStockCount = medicines.filter(m => 
      m.stockQty > 0 && m.stockQty <= m.minStock
    ).length;
    this.outOfStockCount = medicines.filter(m => m.stockQty === 0).length;
  }

  applyFilter(): void {
    this.dataSource.filterPredicate = (data: Medicine, filter: string): boolean => {
      const searchStr = filter.toLowerCase();
      const matchesSearch = !this.searchTerm || 
        data.name.toLowerCase().includes(searchStr) ||
        (data.genericName?.toLowerCase() || '').includes(searchStr) ||
        (data.brandName?.toLowerCase() || '').includes(searchStr);
      
     const matchesCategory =
  !this.selectedCategory ||
  data.category?._id === this.selectedCategory;

      
      const matchesStockStatus = !this.selectedStockStatus || 
        (this.selectedStockStatus === 'in_stock' && data.stockQty > data.minStock) ||
        (this.selectedStockStatus === 'low_stock' && data.stockQty > 0 && data.stockQty <= data.minStock) ||
        (this.selectedStockStatus === 'out_of_stock' && data.stockQty === 0);
      
      return matchesSearch && matchesCategory && matchesStockStatus;
    };
    
    this.dataSource.filter = 'trigger';
    this.updateStatistics();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStockStatus = '';
    this.applyFilter();
  }

  getStockClass(medicine: Medicine): string {
    if (medicine.stockQty === 0) return 'out-of-stock';
    if (medicine.stockQty <= medicine.minStock) return 'low-stock';
    return 'in-stock';
  }

// medicine-management.component.ts

 openAddMedicineDialog(): void {
    // Remove this method or replace with inline form logic
    this.toggleAddForm();
  }
editMedicine(medicine: Medicine): void {
  this.showAddForm = true;
  this.isEditing = true;
  this.selectedMedicineId = medicine._id!;

  // 🔥 FIRST set category type
  this.selectedCategoryType = medicine.category?.type || null;

  // 🔥 Trigger enable/disable logic
  this.categoryChanged(medicine.category?._id);

  // 🔥 THEN patch values
  this.medicineForm.patchValue({
    name: medicine.name,
    genericName: medicine.genericName,
    brandName: medicine.brandName,
    strength: medicine.strength,
    unit: medicine.unit,
    category: medicine.category?._id,
    stockQty: medicine.stockQty,
    minStock: medicine.minStock,
    price: medicine.price,
    expiryDate: medicine.expiryDate,
    batchNumber: medicine.batchNumber,
    supplier: medicine.supplier,
    isActive: medicine.isActive
  });
}





  openStockUpdateDialog(medicine: Medicine): void {
    this.selectedMedicine = medicine;
    this.stockForm.reset({
      type: 'add',
      quantity: 1,
      reason: ''
    });
    
    const dialogRef = this.dialog.open(StockUpdateDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        medicine: medicine,
        stockForm: this.stockForm
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateStock();
      }
      this.selectedMedicine = null;
    });
  }

  createMedicine(data: any) {
    this.isLoading = true;
    this.medicineService.createMedicine(data).subscribe({
      next: res => {
        this.showSuccess("Medicine added");
        this.loadMedicines();
        this.loadLowStockAlerts();
        this.cancelForm();
        this.isLoading = false;
      },
      error: (error) => {
        this.showError("Failed to add medicine");
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  updateMedicine(id: string, data: any) {
    this.isLoading = true;
    this.medicineService.updateMedicine(id, data).subscribe({
      next: res => {
        this.showSuccess("Medicine updated");
        this.loadMedicines();
        this.cancelForm();
        this.isLoading = false;
      },
      error: (error) => {
        this.showError("Update failed");
        console.error(error);
        this.isLoading = false;
      }
    });
  }

 cancelForm(): void {
    this.showAddForm = false;
    this.isEditing = false;
    this.selectedMedicineId = null;
    this.selectedMedicine = null;
    this.medicineForm.reset();
  }
saveMedicine() {
  if (this.medicineForm.invalid) return;

  const raw = this.medicineForm.getRawValue();

  const payload: any = {
    name: raw.name,
    brandName: raw.brandName,
    category: raw.category,
    stockQty: raw.stockQty,
    isActive: raw.isActive
  };

  if (this.selectedCategoryType === 'Medicine') {
    Object.assign(payload, {
      genericName: raw.genericName,
      strength: raw.strength,
      unit: raw.unit,
      minStock: raw.minStock,
      price: raw.price,
      expiryDate: raw.expiryDate,
      batchNumber: raw.batchNumber,
      supplier: raw.supplier
    });
  }

  if (this.selectedCategoryType === 'Consumable') {
    Object.assign(payload, {
      unit: raw.unit,
      minStock: raw.minStock,
      price: raw.price,
      supplier: raw.supplier,
      expiryDate: raw.expiryDate,
      batchNumber: raw.batchNumber
    });
  }

  if (this.selectedCategoryType === 'Cleaning') {
    Object.assign(payload, {
      unit: raw.unit,
      minStock: raw.minStock,
      supplier: raw.supplier,
      price: raw.price
    });
  }

  if (this.selectedCategoryType === 'Equipment') {
    Object.assign(payload, {
      supplier: raw.supplier
    });
  }

  if (this.isEditing && this.selectedMedicineId) {
    this.updateMedicine(this.selectedMedicineId, payload);
  } else {
    this.createMedicine(payload);
  }
}

  private loadNearExpiryMedicines(): void {
  this.medicineService.getNearExpiryMedicines().subscribe({
    next: (res: any) => {
      if (res?.success) {
        this.nearExpiryMedicines = res.data || [];
        this.nearExpiryCount = this.nearExpiryMedicines.length;
      }
    },
    error: err => console.error('Near expiry error', err)
  });
}

private loadExpiredMedicines(): void {
  this.medicineService.getExpiredMedicines().subscribe({
    next: (res: any) => {
      if (res?.success) {
        this.expiredMedicines = res.data || [];
        this.expiredCount = this.expiredMedicines.length;
      }
    },
    error: err => console.error('Expired error', err)
  });
}

  updateStock(): void {
    if (this.stockForm.invalid || !this.selectedMedicine) return;
    
    const { type, quantity } = this.stockForm.value;
    
    this.medicineService.updateStock(this.selectedMedicine._id!, quantity, type)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Stock updated successfully');
            this.loadMedicines();
            this.loadLowStockAlerts();
          } else {
            this.showError(response.message || 'Failed to update stock');
          }
        },
        error: (error) => {
          console.error('Error updating stock:', error);
          this.showError('Error updating stock');
        }
      });
  }
toggleAddForm(): void {
  this.showAddForm = !this.showAddForm;
  this.isEditing = false;
  this.selectedMedicineId = null;

  this.selectedCategoryType = null; // 🔥 VERY IMPORTANT
  this.medicineForm.reset();

  // disable all conditional fields
  this.disableAndClear([
    'genericName',
    'strength',
    'unit',
    'minStock',
    'price',
    'expiryDate',
    'batchNumber',
    'supplier'
  ]);
}
getExpiryStatus(medicine: Medicine): 'expired' | 'near' | 'valid' {
  if (!medicine.expiryDate) return 'valid';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(medicine.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffDays =
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'near';

  return 'valid';
}

  toggleMedicineStatus(medicine: Medicine): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: medicine.isActive ? 'Deactivate Medicine' : 'Activate Medicine',
        message: `Are you sure you want to ${medicine.isActive ? 'deactivate' : 'activate'} ${medicine.name}?`,
        confirmText: medicine.isActive ? 'Deactivate' : 'Activate',
        confirmColor: 'warn'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updates = { isActive: !medicine.isActive };
        this.medicineService.updateMedicine(medicine._id!, updates)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.showSuccess(`Medicine ${medicine.isActive ? 'deactivated' : 'activated'} successfully`);
                this.loadMedicines();
              } else {
                this.showError('Failed to update medicine status');
              }
            },
            error: (error) => {
              console.error('Error updating medicine status:', error);
              this.showError('Error updating medicine status');
            }
          });
      }
    });
  }

  deleteMedicine(medicineId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Medicine',
        message: 'Are you sure you want to delete this medicine? This action cannot be undone.',
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.medicineService.deleteMedicine(medicineId)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.showSuccess('Medicine deleted successfully');
                this.loadMedicines();
              } else {
                this.showError('Failed to delete medicine');
              }
            },
            error: (error) => {
              console.error('Error deleting medicine:', error);
              this.showError('Error deleting medicine');
            }
          });
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
categoryChanged(categoryId?: string) {
  if (!categoryId) return;

  const selectedCat = this.categories.find(cat => cat._id === categoryId);
  if (selectedCat) {
    this.onCategoryChange(selectedCat);
  }
}



  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}