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
    .category-management { padding: 20px; max-width: 900px; margin: 0 auto; }
    .form-row { display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-end; flex-wrap: wrap; }
    table { width: 100%; }
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
