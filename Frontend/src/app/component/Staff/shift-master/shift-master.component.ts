import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ShiftService } from '../../../service/shift.service';
import { Shift } from '../../../models/shift.model';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-shift-master',
  standalone: true,
  templateUrl: './shift-master.component.html',
  styleUrls: ['./shift-master.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
]
})
export class ShiftMasterComponent implements OnInit {

  shiftForm!: FormGroup;
  shifts: Shift[] = [];
  loading = false;
editingId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private shiftService: ShiftService
  ) {}

  ngOnInit(): void {
    this.shiftForm = this.fb.group({
      name: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      isOvernight: [false],
      fullDayMinutes: [480, Validators.required],
      halfDayMinutes: [240, Validators.required],
      maxMinutes: [720, Validators.required]
    });

    this.loadShifts();
  }

  loadShifts(): void {
    this.shiftService.getShifts().subscribe(res => {
      this.shifts = res.data;
    });
  }


deactivateShift(id: string) {
  if (!confirm('Deactivate this shift?')) return;

  this.shiftService.deactivateShift(id).subscribe(() => {
    this.loadShifts();
  });
}
  saveShift(): void {
    if (this.shiftForm.invalid) return;

    this.loading = true;

    this.shiftService.createShift(this.shiftForm.value).subscribe({
      next: () => {
        this.shiftForm.reset({
          isOvernight: false,
          fullDayMinutes: 480,
          halfDayMinutes: 240,
          maxMinutes: 720
        });
        this.loadShifts();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
