import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CareUnitService } from '../../service/careUnit.service';
import { CareUnit } from '../../models/careUnit.model';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-care-unit-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatTableModule,
  MatCardModule,
  MatButtonModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatSnackBarModule
],
  template: `
  <mat-card class="page-card">
    <h2>Care Unit Master (Ward / Room)</h2>

    <!-- FORM -->
    <form [formGroup]="form" class="unit-form">
      <mat-form-field appearance="outline">
        <mat-label>Unit Number</mat-label>
        <input matInput formControlName="unitNumber" placeholder="WARD-1 / ROOM-1">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Category</mat-label>
        <select matNativeControl formControlName="category">
          <option value="Ward">Ward</option>
          <option value="Room">Room</option>
        </select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Capacity (Beds)</mat-label>
        <input matInput type="number" formControlName="capacity">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Charges / Day</mat-label>
        <input matInput type="number" formControlName="chargesPerDay">
      </mat-form-field>

      <div class="form-actions">
        <button mat-raised-button color="primary" (click)="submit()">
          {{ editId ? 'Update' : 'Create' }}
        </button>
        <button mat-button (click)="reset()">Clear</button>
      </div>
    </form>

    <!-- TABLE -->
    <table mat-table [dataSource]="careUnits" class="mat-elevation-z2">

      <ng-container matColumnDef="unitNumber">
        <th mat-header-cell *matHeaderCellDef>Unit</th>
        <td mat-cell *matCellDef="let u">{{ u.unitNumber }}</td>
      </ng-container>

      <ng-container matColumnDef="category">
        <th mat-header-cell *matHeaderCellDef>Type</th>
        <td mat-cell *matCellDef="let u">{{ u.category }}</td>
      </ng-container>

      <ng-container matColumnDef="capacity">
        <th mat-header-cell *matHeaderCellDef>Beds</th>
        <td mat-cell *matCellDef="let u">
          {{ u.occupiedBeds || 0 }} / {{ u.capacity }}
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let u">
          <span [class.active]="u.isActive" [class.inactive]="!u.isActive">
            {{ u.isActive ? 'ACTIVE' : 'INACTIVE' }}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let u">
          <button mat-icon-button color="primary" (click)="edit(u)">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="toggle(u)">
            <mat-icon>{{ u.isActive ? 'block' : 'check_circle' }}</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  </mat-card>
  `,
  styles: [`
    .page-card { padding: 20px; }
    .unit-form {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 10px;
    }
    table { width: 100%; margin-top: 20px; }
    .active { color: green; font-weight: 600; }
    .inactive { color: red; font-weight: 600; }
  `]
})
export class CareUnitMasterComponent implements OnInit {

  private fb = inject(FormBuilder);
  private service = inject(CareUnitService);
  private snack = inject(MatSnackBar);

  form!: FormGroup;
  careUnits: CareUnit[] = [];
  editId: string | null = null;

  cols = ['unitNumber', 'category', 'capacity', 'status', 'actions'];

  ngOnInit() {
    this.form = this.fb.group({
      unitNumber: ['', Validators.required],
      name: ['', Validators.required],
      category: ['Ward', Validators.required],
      capacity: [1, Validators.required],
      chargesPerDay: [0],
      isActive: [true]
    });
    this.load();
  }

  load() {
    this.service.getAllCareUnits().subscribe(res => this.careUnits = res.data as CareUnit[]);
  }

  submit() {
    if (this.form.invalid) return;

    const api = this.editId
      ? this.service.updateCareUnit(this.editId, this.form.value)
      : this.service.createCareUnit(this.form.value);

    api.subscribe(() => {
      this.snack.open('Saved successfully', 'Close', { duration: 3000 });
      this.reset();
      this.load();
    });
  }

  edit(unit: CareUnit) {
    this.editId = unit._id;
    this.form.patchValue(unit);
  }

  toggle(unit: CareUnit) {
    this.service.updateCareUnit(unit._id, { isActive: !unit.isActive }).subscribe(() => {
      unit.isActive = !unit.isActive;
    });
  }

  reset() {
    this.editId = null;
    this.form.reset({ category: 'Ward', capacity: 1, isActive: true });
  }
}
