import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { CategoryService } from '../../service/category.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
  <div class="category-management">
    <h2>Category Master</h2>
    
    <!-- Add/Edit Form -->
    <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
      <div class="form-row">
        <mat-form-field>
          <mat-label>Category Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Type</mat-label>
          <mat-select formControlName="type" required>
            <mat-option value="Medicine">Medicine</mat-option>
    <mat-option value="Equipment">Equipment</mat-option>
    <mat-option value="Consumable">Consumable</mat-option>
    <mat-option value="Cleaning">Cleaning</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" type="submit">
          {{ isEditing ? 'Update' : 'Add' }}
        </button>
        <button mat-button type="button" (click)="cancelForm()">Cancel</button>
      </div>
    </form>

    <!-- Table -->
    <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z1">

      <!-- Name -->
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let category">{{ category.name }}</td>
      </ng-container>

      <!-- Type -->
      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
        <td mat-cell *matCellDef="let category">{{ category.type }}</td>
      </ng-container>

      <!-- Actions -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let category">
          <button mat-icon-button color="primary" (click)="editCategory(category)">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deleteCategory(category)">
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  </div>
  `,
  styles: [`
/* ===============================
   CATEGORY MASTER – PREMIUM UI
   =============================== */

.category-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  padding: 42px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

/* Page Title */
.category-management > h2 {
  width: 100%;
  max-width: 960px;
  margin: 0 auto 20px;
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: 0.3px;
  position: relative;
  padding-left: 10px;
}

.category-management > h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 4px;
  height: 70%;
  border-radius: 4px;
  background: linear-gradient(180deg, #2563eb, #38bdf8);
}

/* ===============================
   FORM CARD
   =============================== */

form {
  width: 100%;
  max-width: 960px;
  background: #ffffff;
  padding: 24px 26px;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  margin-bottom: 28px;
  border: 1px solid #e5e7eb;
}

/* Form row */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  align-items: stretch; /* ✅ FIX: prevents hanging */
}

/* Material fields */
mat-form-field {
  width: 100%;
}

/* Align buttons with inputs */
.form-row button {
  margin-top: 22px; /* ✅ aligns with mat-form-field baseline */
  height: 44px;
  align-self: flex-start;
}

/* Remove extra Material bottom spacing */
::ng-deep .mat-mdc-form-field-subscript-wrapper {
  display: none;
}

/* Buttons */
button[mat-raised-button] {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  padding: 0 16px;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

button[mat-raised-button]:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.45);
}

button[mat-button] {
  height: 44px;
  border-radius: 12px;
  font-weight: 500;
  color: #475569;
}

/* ===============================
   TABLE CARD
   =============================== */

table {
  width: 100%;
  max-width: 960px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  border: 1px solid #e5e7eb;
}

/* Table Header */
th {
  background: #f1f5f9;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  padding: 14px 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Table Body */
td {
  font-size: 14px;
  color: #1e293b;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
}

/* Hover */
tr.mat-row:hover {
  background: #f8fafc;
}

/* Action buttons */
td button[mat-icon-button] {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  transition: background 0.2s ease;
}

td button[mat-icon-button]:hover {
  background: #f1f5f9;
}

/* ===============================
   RESPONSIVE DESIGN
   =============================== */

@media (max-width: 1024px) {
  .category-management {
    padding: 48px 20px;
  }

  .category-management > h2 {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .category-management {
    padding: 28px 14px;
  }

  form {
    padding: 18px;
  }

  .form-row button {
    width: 100%;
    margin-top: 0;
  }

  table {
    display: block;
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .category-management > h2 {
    font-size: 20px;
  }

  th,
  td {
    font-size: 12px;
    padding: 12px;
  }
}

/* ===============================
   SCROLLBAR
   =============================== */

table::-webkit-scrollbar {
  height: 8px;
}

table::-webkit-scrollbar-track {
  background: #f1f5f9;
}

table::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  border-radius: 10px;
}


  `]
})
export class CategoryManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  categoryForm!: FormGroup;
  isEditing = false;
  selectedCategoryId: string | null = null;

  displayedColumns: string[] = ['name', 'type', 'actions'];
  dataSource = new MatTableDataSource<any>();

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
    });
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe((res: any) => {
      this.dataSource.data = res.data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  saveCategory() {
    if (this.categoryForm.invalid) return;
    const data = this.categoryForm.value;

    if (this.isEditing && this.selectedCategoryId) {
      this.categoryService.updateCategory(this.selectedCategoryId, data).subscribe(() => {
        this.snackBar.open('Category updated', 'Close', { duration: 3000 });
        this.loadCategories();
        this.cancelForm();
      });
    } else {
      this.categoryService.createCategory(data).subscribe(() => {
        this.snackBar.open('Category added', 'Close', { duration: 3000 });
        this.loadCategories();
        this.cancelForm();
      });
    }
  }

  editCategory(category: any) {
    this.isEditing = true;
    this.selectedCategoryId = category._id;
    this.categoryForm.patchValue({
      name: category.name,
      type: category.type
    });
  }

  cancelForm() {
    this.isEditing = false;
    this.selectedCategoryId = null;
    this.categoryForm.reset();
  }

  deleteCategory(category: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoryService.deleteCategory(category._id).subscribe(() => {
          this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
          this.loadCategories();
        });
      }
    });
  }
}
