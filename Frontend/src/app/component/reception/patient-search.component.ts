import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { Patient } from '../../models/patient.model';
import { MatSelectModule } from "@angular/material/select";
import { PatientDetailsComponent } from './patient-details.component';
import { VisitService } from '../../service/visit.service';
import { Router } from '@angular/router';
import { PatientService } from '../../service/patient.service';

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatTabsModule,
    MatChipsModule,
    MatSelectModule
],
  template: `
    <div class="patient-search-container">
      <!-- Search Header -->
      <mat-card class="search-header">
        <mat-card-header>
          <mat-card-title>Patient Search</mat-card-title>
          <mat-card-subtitle>Search and select patient for visit</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <div class="search-controls">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search Patients</mat-label>
                <input matInput formControlName="query" 
                  placeholder="Search by name, mobile, OP number..." 
                  (keyup.enter)="onSearch()">
                <mat-icon matSuffix>search</mat-icon>
                <mat-hint>Enter name, mobile number, or OP number</mat-hint>
              </mat-form-field>
              
              <button mat-raised-button color="primary" type="submit" [disabled]="isLoading">
                <mat-icon>search</mat-icon>
                Search
              </button>
              
              <button mat-button type="button" (click)="clearSearch()" [disabled]="isLoading">
                <mat-icon>clear</mat-icon>
                Clear
              </button>
            </div>
            
            <!-- Advanced Search Options (Collapsible) -->
            <div class="advanced-search" *ngIf="showAdvancedSearch">
              <div class="advanced-fields">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Gender</mat-label>
                  <mat-select formControlName="gender">
                    <mat-option value="">All</mat-option>
                    <mat-option value="Male">Male</mat-option>
                    <mat-option value="Female">Female</mat-option>
                    <mat-option value="Other">Other</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Patient Type</mat-label>
                  <mat-select formControlName="patientType">
                    <mat-option value="">All</mat-option>
                    <mat-option value="OP">OP</mat-option>
                    <mat-option value="IP">IP</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>City</mat-label>
                  <input matInput formControlName="city" placeholder="Filter by city">
                </mat-form-field>
              </div>
            </div>
            
            <button mat-button type="button" (click)="toggleAdvancedSearch()" class="toggle-advanced">
              {{ showAdvancedSearch ? 'Hide Advanced' : 'Show Advanced' }} Search
              <mat-icon>{{ showAdvancedSearch ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </form>
        </mat-card-content>
      </mat-card>



      <!-- Search Results -->
      <div class="search-results" *ngIf="searchPerformed">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Search Results</mat-card-title>
            <mat-card-subtitle>
              Found {{ dataSource.data.length }} patients
              <span *ngIf="searchForm.get('query')?.value">for "{{ searchForm.get('query')?.value }}"</span>
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="export-actions">
  <button mat-stroked-button color="primary" (click)="exportExcel()">
    <mat-icon>table_chart</mat-icon>
    Export Excel
  </button>

  <button mat-stroked-button color="accent" (click)="exportPDF()">
    <mat-icon>picture_as_pdf</mat-icon>
    Export PDF
  </button>
</div>

            <!-- Data Table -->
            <div class="table-container">
              <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z1">
                
                <!-- OP Number Column -->
                <ng-container matColumnDef="opNumber">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>OP Number</th>
                  <td mat-cell *matCellDef="let patient">
                    <span class="op-number">{{ patient.opNumber }}</span>
                  </td>
                </ng-container>

                <!-- Name Column -->
                <ng-container matColumnDef="fullName">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                  <td mat-cell *matCellDef="let patient">
                    <div class="patient-name-cell">
                      <mat-icon class="patient-icon-small">person</mat-icon>
                      <span>{{ patient.fullName }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Age/Gender Column -->
                <ng-container matColumnDef="demographics">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Age/Gender</th>
                  <td mat-cell *matCellDef="let patient">
                    <span class="demographics">
                      {{ patient.age }}Y / {{ patient.gender }}
                      <mat-chip *ngIf="patient.patientType === 'IP'" color="warn" selected class="ip-chip">
                        IP
                      </mat-chip>
                    </span>
                  </td>
                </ng-container>

                <!-- Mobile Column -->
                <ng-container matColumnDef="mobile">
                  <th mat-header-cell *matHeaderCellDef>Mobile</th>
                  <td mat-cell *matCellDef="let patient">
                    <a href="tel:{{ patient.mobile }}" class="mobile-link">
                      <mat-icon class="mobile-icon">phone</mat-icon>
                      {{ patient.mobile }}
                    </a>
                  </td>
                </ng-container>

                <!-- City Column -->
              <ng-container matColumnDef="city">
  <th mat-header-cell *matHeaderCellDef mat-sort-header>City</th>
  <td mat-cell *matCellDef="let patient">
    {{ patient.address?.city || '-' }}
  </td>
</ng-container>

<ng-container matColumnDef="registrationDate">
  <th mat-header-cell *matHeaderCellDef mat-sort-header>
    Registered On
  </th>
  <td mat-cell *matCellDef="let patient">
    {{ patient.createdAt | date:'dd/MM/yyyy' }}
  </td>
</ng-container>

                <!-- Last Visit Column -->
                <ng-container matColumnDef="lastVisit">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Visit</th>
                  <td mat-cell *matCellDef="let patient">
                    {{ patient.lastVisitDate ? (patient.lastVisitDate | date:'dd/MM/yyyy') : 'No visits' }}
                  </td>
                </ng-container>

               <!-- Actions Column -->
<ng-container matColumnDef="actions">
  <th mat-header-cell *matHeaderCellDef>Actions</th>
  <td mat-cell *matCellDef="let patient">
    <div class="action-buttons">
      <button mat-icon-button color="primary" 
        matTooltip="View Details"
        (click)="viewDetails(patient)">
        <mat-icon>visibility</mat-icon>
      </button>
      <!-- <button mat-icon-button color="accent" 
        matTooltip="Select Patient"
        (click)="selectPatient(patient)">
        <mat-icon>check_circle</mat-icon>
      </button> -->
      <button mat-icon-button color="primary" 
        matTooltip="Create New Visit"
        (click)="createVisit(patient)">
        <mat-icon>add_circle</mat-icon>
      </button>
      <!-- Add Edit button -->
      <!-- <button mat-icon-button color="warn" 
        matTooltip="Edit Patient"
        (click)="editPatient(patient); $event.stopPropagation()"
        *ngIf="canEdit()">
        <mat-icon>edit</mat-icon>
      </button>
        matTooltip="Delete Patient"
        (click)="deletePatient(patient); $event.stopPropagation()"
        *ngIf="canDelete()">
        <mat-icon>delete</mat-icon>
      </button> --> 
    </div>
  </td>
</ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
            </div>

            <!-- No Results Message -->
            <div *ngIf="dataSource.data.length === 0" class="no-results">
              <mat-icon class="no-results-icon">search_off</mat-icon>
              <h3>No patients found</h3>
              <p>Try a different search term or check the spelling</p>
              <button mat-raised-button color="primary" (click)="clearSearch()">
                <mat-icon>refresh</mat-icon>
                Clear Search
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats" *ngIf="!searchPerformed">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Quick Statistics</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{ totalPatients | number }}</div>
                <div class="stat-label">Total Patients</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ activePatients | number }}</div>
                <div class="stat-label">Active Patients</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ opPatients | number }}</div>
                <div class="stat-label">OP Patients</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ ipPatients | number }}</div>
                <div class="stat-label">IP Patients</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .patient-search-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background: #d0dff5;
    }
    .mat-card-title{
      color: #1565c0;
    }
    .search-header {
      margin-bottom: 20px;
    }
    
    .search-controls {
      display: flex;
      gap: 15px;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    
    .search-field {
      flex: 1;
    }
    
    .advanced-search {
      margin-top: 20px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      animation: slideDown 0.3s ease;
    }
    
    .advanced-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .half-width {
      flex: 1;
      min-width: 200px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .toggle-advanced {
      margin-top: 10px;
      width: 100%;
      text-align: left;
    }
    
    .recent-section {
      margin-bottom: 20px;
    }
    
    .recent-patients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .patient-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .patient-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .patient-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .patient-icon {
      color: #3f51b5;
      font-size: 32px;
      height: 32px;
      width: 32px;
    }
    
    .patient-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }
    
    .detail-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    
    .search-results {
      margin-top: 20px;
    }
    
    .table-container {
      overflow-x: auto;
      margin-top: 15px;
    }
    
    .op-number {
      font-family: monospace;
      font-weight: bold;
      color: #3f51b5;
    }
    
    .patient-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .patient-icon-small {
      color: #666;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .demographics {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ip-chip {
      font-size: 10px;
      height: 20px;
      padding: 0 6px;
    }
    
    .mobile-link {
      display: flex;
      align-items: center;
      gap: 5px;
      color: inherit;
      text-decoration: none;
    }
    
    .mobile-link:hover {
      color: #3f51b5;
    }
    
    .mobile-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    
    .action-buttons {
      display: flex;
      gap: 5px;
    }
    
    .no-results {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    
    .no-results-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 15px;
      color: #bbb;
    }
    
    .quick-stats {
      margin-top: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .stat-item {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      transition: transform 0.2s;
    }
    
    .stat-item:hover {
      transform: translateY(-2px);
      background: #e8eaf6;
    }
    
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #3f51b5;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media (max-width: 768px) {
      .search-controls {
        flex-direction: column;
      }
      
      .search-field {
        width: 100%;
      }
      
      .advanced-fields {
        flex-direction: column;
      }
      
      .half-width {
        width: 100%;
      }
      
      .recent-patients-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class PatientSearchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
    private visitService: VisitService = inject(VisitService);

  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  userRole: string = 'Reception'; // This should come from your auth service
currentUserId: string = ''; // Get from auth service
  searchForm!: FormGroup;
  dataSource = new MatTableDataSource<Patient>([]);
  displayedColumns: string[] = ['opNumber', 'fullName', 'demographics', 'mobile', 'city',  'registrationDate',
 'lastVisit', 'actions'];
  
  // Search state
  isLoading = false;
  searchPerformed = false;
  showAdvancedSearch = false;
  
  // Patient lists
  recentPatients: Patient[] = [];
  
  // Statistics
  totalPatients = 0;
  activePatients = 0;
  opPatients = 0;
  ipPatients = 0;
  
  // For dialog mode
  isDialogMode = false;
  dialogRef?: MatDialogRef<PatientSearchComponent>;

  ngOnInit(): void {
    this.initForm();
    this.loadRecentPatients();
  }
  canEdit(): boolean {
  // Reception and Admin can edit
  return ['Reception', 'Admin'].includes(this.userRole);
}

canDelete(): boolean {
  // Both Reception and Admin can delete
  return ['Reception', 'Admin'].includes(this.userRole);
}

canDeactivate(patient: Patient): boolean {
   return ['Reception', 'Admin'].includes(this.userRole);

}
openRecentPatient(patient: Patient) {
  this.dialog.open(PatientDetailsComponent, {
    width: '800px',
    maxHeight: '90vh',
    data: {
      patient,
      viewOnly: false   // recent patients → full CRUD
    }
  });
}

// Update the editPatient method
editPatient(patient: Patient): void {
  console.log('Edit patient', patient._id);
  // router.navigate(['/reception/patient/edit', patient._id])
}

 

// Add this method in the PatientSearchComponent class
canCreateVisit(): boolean {
  // Reception and Admin can create visits
  return ['Reception', 'Admin'].includes(this.userRole);
}
// Update the deletePatient method
deletePatient(patient: Patient): void {
  if (!this.canDelete()) {
    this.snackBar.open('You are not authorized to delete patients', 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
    return;
  }

  // Reception can delete ANY patient (remove ownership check)
  const confirmDelete = confirm(`Are you sure you want to delete ${patient.fullName}? This action cannot be undone.`);
  
  if (!confirmDelete) return;

  this.patientService.deletePatient(patient._id).subscribe({
    next: (response) => {
      this.snackBar.open(response.message || 'Patient deleted successfully', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      
      // Refresh the data
      if (this.searchPerformed) {
        this.onSearch();
      } else {
        this.loadRecentPatients();
      }
    },
    error: (error) => {
      console.error('Error deleting patient:', error);
      this.snackBar.open(error.error?.message || 'Error deleting patient', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  });
}

  private initForm(): void {
    this.searchForm = this.fb.group({
      query: [''],
      gender: [''],
      patientType: [''],
      city: ['']
    });
  }

  private loadRecentPatients(): void {
    this.isLoading = true;
    this.patientService.getRecentPatients(6).subscribe({
      next: (patients) => {
        this.recentPatients = patients;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error loading recent patients', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        this.isLoading = false;
      }
    });
  }


  onSearch(): void {
  const query = this.searchForm.get('query')?.value || '';
  const gender = this.searchForm.get('gender')?.value;
  const patientType = this.searchForm.get('patientType')?.value;
  const city = this.searchForm.get('city')?.value;

  if (!query && !this.showAdvancedSearch) {
    this.snackBar.open('Please enter a search term', 'Close', { duration: 3000, panelClass: ['warning-snackbar'] });
    return;
  }

  this.isLoading = true;
  this.searchPerformed = true;

  this.patientService.searchPatients(query, 1, 50).subscribe({
    next: (res) => {
      let filtered = res.data;

      // Apply advanced filters locally
      if (gender) filtered = filtered.filter(p => p.gender === gender);
      if (patientType) filtered = filtered.filter(p => p.patientType === patientType);
      if (city) {
        filtered = filtered.filter(p => {
          // Handle patients without address object or city property
          return p.address && p.address.city && p.address.city === city;
        });
      }

      this.dataSource.data = filtered;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      this.isLoading = false;
    },
    error: (err) => {
      console.error(err);
      this.snackBar.open('Error searching patients', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      this.isLoading = false;
    }
  });
}

  private applyAdvancedFilters(): void {
    const gender = this.searchForm.get('gender')?.value;
    const patientType = this.searchForm.get('patientType')?.value;
    const city = this.searchForm.get('city')?.value;

    if (!gender && !patientType && !city) return;

    this.dataSource.filterPredicate = (data: Patient, filter: string) => {
      const filters = JSON.parse(filter);
      
      let matches = true;
      
      if (filters.gender && data.gender !== filters.gender) {
        matches = false;
      }
      
      if (filters.patientType && data.patientType !== filters.patientType) {
        matches = false;
      }
      
      if (filters.city && data.address?.city !== filters.city) {
        matches = false;
      }
      
      return matches;
    };

    const filterObj = {
      gender: gender || '',
      patientType: patientType || '',
      city: city || ''
    };

    this.dataSource.filter = JSON.stringify(filterObj);
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.dataSource.data = [];
    this.searchPerformed = false;
    this.showAdvancedSearch = false;
    this.loadRecentPatients();
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

viewDetails(patient: Patient): void {
  const dialogRef = this.dialog.open(PatientDetailsComponent, {
    width: '900px',
    maxHeight: '90vh',
    data: { patient }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (!result) return;

    switch (result.action) {
      case 'create-visit':
        this.createVisit(result.patient);
        break;

      case 'edit-patient':
        this.editPatient(result.patient);
        break;

      case 'delete-patient':
        this.deletePatient(result.patient);
        break;

      case 'edit-visit':
        this.openEditVisit(result.visit);
        break;

      case 'delete-visit':
        this.deleteVisit(result.visit);
        break;
    }
  });
}
getFilteredPatients(): Patient[] {
  return this.dataSource.filteredData.length
    ? this.dataSource.filteredData
    : this.dataSource.data;
}

openEditVisit(visit: any) {
  console.log('Edit visit', visit);
  // router.navigate(['/reception/visit/edit', visit._id])
}

deleteVisit(visit: any) {
  if (!confirm('Delete visit?')) return;

  this.visitService.deleteVisit(visit._id)
.subscribe({
    next: () => {
      this.snackBar.open('Visit deleted', 'Close', { duration: 3000 });
      this.onSearch();
    },
    error: () => {
      this.snackBar.open('Delete failed', 'Close', { duration: 3000 });
    }
  });
}

selectPatient(patient: Patient): void {
  // Close the dialog and return the patient
  const dialogRef = this.dialog.getDialogById('patient-search-dialog');
  if (dialogRef) {
    dialogRef.close(patient);
  }
}

createVisit(patient: any) {
  // Navigate to the visit creation page with patient info
  this.router.navigate(['/reception/visit/create'], {
    state: { patient }
  });
}

exportExcel(): void {
  const patients = this.getFilteredPatients();

  if (!patients.length) {
    this.snackBar.open('No data to export', 'Close', { duration: 3000 });
    return;
  }

  // Lazy load xlsx (recommended)
  import('xlsx').then(XLSX => {
    const worksheet = XLSX.utils.json_to_sheet(
      patients.map(p => ({
        'OP Number': p.opNumber,
        'Name': p.fullName,
        'Gender': p.gender,
        'Age': p.age,
        'Mobile': p.mobile,
        'City': p.address?.city || '',
        'Registered On': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        'Last Visit': p.lastVisitDate ? new Date(p.lastVisitDate).toLocaleDateString() : 'No visits'
      }))
    );

    const workbook = {
      Sheets: { 'Patients': worksheet },
      SheetNames: ['Patients']
    };

    XLSX.writeFile(workbook, 'patients.xlsx');
  });
}
exportPDF(): void {
  const patients = this.getFilteredPatients();

  if (!patients.length) {
    this.snackBar.open('No data to export', 'Close', { duration: 3000 });
    return;
  }

  import('jspdf').then(jsPDF => {
    import('jspdf-autotable').then(autoTable => {

      const doc = new jsPDF.default('p', 'mm', 'a4');

      doc.setFontSize(14);
      doc.text('Patient List', 14, 15);

      const rows = patients.map(p => ([
        p.opNumber || '',
        p.fullName || '',
        `${p.age || ''} / ${p.gender || ''}`,
        p.mobile || '',
        p.address?.city || '',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        p.lastVisitDate ? new Date(p.lastVisitDate).toLocaleDateString() : 'No visits'
      ]));

      autoTable.default(doc, {
        head: [[
          'OP No',
          'Name',
          'Age / Gender',
          'Mobile',
          'City',
          'Registered On',
          'Last Visit'
        ]],
        body: rows,
        startY: 22,
        styles: { fontSize: 9 }
      });

      doc.save(`patients_${Date.now()}.pdf`);
    });
  });
}


  // For table sorting and pagination
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}