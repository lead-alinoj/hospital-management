import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { Chart, registerables } from 'chart.js';
import { AttendanceService } from '../../service/attendance.service';
import { StaffService } from '../../service/staff.service';
import { BedService } from '../../service/bed.service';
import { MedicineService } from '../../service/medicine.service';
import { IpAdmissionService } from '../../service/ip-admission.service';
import { VisitService } from '../../service/visit.service';
import { PatientService } from '../../service/patient.service';
import { PrescriptionService } from '../../service/prescription.service';
import { RouterModule } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule,
    RouterModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('attendancePie') attendancePie!: ElementRef;
  @ViewChild('bedBar') bedBar!: ElementRef;
  @ViewChild('patientFlowChart') patientFlowChart!: ElementRef;
  @ViewChild('medicineChart') medicineChart!: ElementRef;
  
  loading = true;
  
  // === 1️⃣ STAFF OVERVIEW ===
  totalStaff = 0;
  presentToday = 0;
  absentToday = 0;
  halfDayToday = 0;
  pendingLogout = 0;
  attendanceRate = 0;
  
  // === 2️⃣ TODAY'S PATIENT FLOW ===
  totalVisitsToday = 0;
  waitingForVitals = 0;
  waitingForConsultation = 0;
  consultationCompleted = 0;
  
  // === 3️⃣ PHARMACY SNAPSHOT ===
  totalMedicines = 0;
  lowStockMedicines = 0;
  expiredMedicines = 0;
  nearExpiryMedicines = 0;
  
  // === 4️⃣ IP / BED STATUS ===
  totalBeds = 0;
  availableBeds = 0;
  occupiedBeds = 0;
  currentIPPatients = 0;
  
  // === 5️⃣ ALERTS & WARNINGS ===
  alerts: any[] = [];
  
  // === QUICK SEARCH ===
  searchQuery = '';
  
  constructor(
    private attendanceService: AttendanceService,
    private staffService: StaffService,
    private bedService: BedService,
    private medicineService: MedicineService,
    private ipService: IpAdmissionService,
    private visitService: VisitService,
    private patientService: PatientService,
    private prescriptionService: PrescriptionService
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderCharts();
    }, 1000);
  }
  
  loadDashboardData(): void {
    this.loading = true;
    
    // Load all data in parallel
    Promise.all([
      this.loadStaffData(),
      this.loadPatientFlowData(),
      this.loadPharmacyData(),
      this.loadBedData(),
      this.loadAlerts()
    ]).then(() => {
      this.loading = false;
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
    });
  }
  
  loadStaffData(): Promise<void> {
    return new Promise((resolve) => {
      // Get total staff
      this.staffService.getActiveStaff().subscribe({
        next: (res) => {
          this.totalStaff = res.data?.length || 0;
          
          // Get today's attendance summary
          const today = new Date().toISOString().split('T')[0];
this.attendanceService.getAttendanceSummaryLive(today, today).subscribe({
            next: (attRes) => {
const todaySummary = attRes.data?.[0]?.attendance || [];

this.presentToday =
  todaySummary.find((s: any) => s.status === 'Present')?.count || 0;

this.absentToday = Math.max(
  this.totalStaff - (this.presentToday + this.halfDayToday),
  0
);


this.halfDayToday =
  todaySummary.find((s: any) => s.status === 'Half Day')?.count || 0;

              
              this.attendanceRate = this.totalStaff > 0 
                ? Math.round((this.presentToday / this.totalStaff) * 100)
                : 0;
              
              // Get pending logout
              this.attendanceService.getPendingLogout().subscribe({
                next: (pendingRes) => {
                  this.pendingLogout = pendingRes.data?.length || 0;
                  resolve();
                }
              });
            }
          });
        }
      });
    });
  }
  
loadPatientFlowData(): Promise<void> {
  return new Promise((resolve) => {
    this.visitService.getTodayVisits().subscribe({
      next: (res: any) => {
        // Backend returns grouped visits object, not a flat array
        const groupedVisits = res.data || {};
        
        // Extract counts from grouped object
        this.totalVisitsToday = 
          (groupedVisits.waiting?.length || 0) +
          (groupedVisits.vitals_in_progress?.length || 0) +
          (groupedVisits.vitals_completed?.length || 0) +
          (groupedVisits.consultation_in_progress?.length || 0) +
          (groupedVisits.consultation_completed?.length || 0) +
          (groupedVisits.pharmacy?.length || 0) +
          (groupedVisits.completed?.length || 0);
        
        this.waitingForVitals = 
          (groupedVisits.waiting?.length || 0) + 
          (groupedVisits.vitals_in_progress?.length || 0);
        this.waitingForConsultation = groupedVisits.consultation_in_progress?.length || 0;
        this.consultationCompleted = groupedVisits.consultation_completed?.length || 0;
        
        resolve();
      },
      error: (err: any) => {
        console.error('Error loading patient flow data:', err);
        // Set fallback values
        this.totalVisitsToday = 0;
        this.waitingForVitals = 0;
        this.waitingForConsultation = 0;
        this.consultationCompleted = 0;
        resolve();
      }
    });
  });
}
  
  loadPharmacyData(): Promise<void> {
    return new Promise((resolve) => {
      this.medicineService.getMedicines(1, 1).subscribe({
        next: (res) => {
          this.totalMedicines = res.total || res.count || 0;
          
          this.medicineService.getLowStockMedicines().subscribe({
            next: (lowStockRes) => {
              this.lowStockMedicines = lowStockRes.data?.length || 0;
              // Note: You would need an endpoint for expired/near-expiry medicines
              // For now, we'll set placeholder values
            this.medicineService.getNearExpiryMedicines().subscribe(res => {
  this.nearExpiryMedicines = res.data?.length || 0;
});

this.medicineService.getExpiredMedicines().subscribe(res => {
  this.expiredMedicines = res.data?.length || 0;
});

              resolve();
            }
          });
        }
      });
    });
  }
  
  loadBedData(): Promise<void> {
    return new Promise((resolve) => {
      this.bedService.getAllBeds().subscribe({
        next: (bedsRes) => {
          const beds = Array.isArray(bedsRes.data) ? bedsRes.data : [bedsRes.data];
          this.totalBeds = beds.length;
          
          this.bedService.getAvailableBeds().subscribe({
            next: (availableRes) => {
              const available = Array.isArray(availableRes.data) ? availableRes.data : [availableRes.data];
              this.availableBeds = available.length;
              this.occupiedBeds = this.totalBeds - this.availableBeds;
              
              // Get current IP patients
              this.ipService.getCurrentIPPatients().subscribe({
                next: (ipRes) => {
                  this.currentIPPatients = ipRes.data?.length || 0;
                  resolve();
                }
              });
            }
          });
        }
      });
    });
  }
  
  loadAlerts(): void {
    // Build alerts based on dashboard data
    this.alerts = [];
    
    // Low stock alert
    if (this.lowStockMedicines > 0) {
      this.alerts.push({
        type: 'warning',
        icon: 'warning',
        message: `${this.lowStockMedicines} medicines are low in stock`,
        color: '#f59e0b'
      });
    }
    
    // Pending logout alert
    if (this.pendingLogout > 0) {
      this.alerts.push({
        type: 'info',
        icon: 'logout',
        message: `${this.pendingLogout} staff members haven't logged out`,
        color: '#8b5cf6'
      });
    }
    
    // Bed occupancy alert
    const occupancyRate = this.totalBeds > 0 ? (this.occupiedBeds / this.totalBeds) * 100 : 0;
    if (occupancyRate > 90) {
      this.alerts.push({
        type: 'warning',
        icon: 'hotel',
        message: 'Bed occupancy rate is high',
        color: '#ef4444'
      });
    }
    
    // No current IP patients
    if (this.currentIPPatients === 0 && this.totalBeds > 0) {
      this.alerts.push({
        type: 'info',
        icon: 'info',
        message: 'No IP patients currently',
        color: '#3b82f6'
      });
    }
  }
  
  renderCharts(): void {
    this.renderAttendancePieChart();
    this.renderBedBarChart();
    this.renderPatientFlowChart();
    this.renderMedicineChart();
  }
  
  renderAttendancePieChart(): void {
    if (!this.attendancePie) return;
    
    const ctx = this.attendancePie.nativeElement.getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Present', 'Absent', 'Half Day'],
        datasets: [{
          data: [this.presentToday, this.absentToday, this.halfDayToday],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)'
          ],
          borderWidth: 2,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
            padding: 12
          }
        }
      }
    });
  }
  
  renderBedBarChart(): void {
    if (!this.bedBar) return;
    
    const ctx = this.bedBar.nativeElement.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Available', 'Occupied'],
        datasets: [{
          data: [this.availableBeds, this.occupiedBeds],
          backgroundColor: [
            'rgba(56, 189, 248, 0.8)',
            'rgba(99, 102, 241, 0.8)'
          ],
          borderColor: [
            'rgb(56, 189, 248)',
            'rgb(99, 102, 241)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(241, 245, 249, 0.8)'
            },
            ticks: {
              font: {
                size: 12
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  renderPatientFlowChart(): void {
    if (!this.patientFlowChart) return;
    
    const ctx = this.patientFlowChart.nativeElement.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Waiting Vitals', 'Waiting Consultation', 'Completed'],
        datasets: [{
          data: [this.waitingForVitals, this.waitingForConsultation, this.consultationCompleted],
          backgroundColor: [
            'rgba(251, 191, 36, 0.8)',
            'rgba(248, 113, 113, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderColor: [
            'rgb(251, 191, 36)',
            'rgb(248, 113, 113)',
            'rgb(16, 185, 129)'
          ],
          borderWidth: 2,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }
  
  renderMedicineChart(): void {
    if (!this.medicineChart) return;
    
    const ctx = this.medicineChart.nativeElement.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total', 'Low Stock', 'Near Expiry'],
        datasets: [{
          data: [this.totalMedicines, this.lowStockMedicines, this.nearExpiryMedicines],
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgb(139, 92, 246)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(241, 245, 249, 0.8)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  onSearch(): void {
    if (this.searchQuery.trim()) {
      // Implement search logic here
      console.log('Searching for:', this.searchQuery);
    }
  }
  
  refreshDashboard(): void {
    this.loading = true;
    this.loadDashboardData();
    setTimeout(() => {
      this.renderCharts();
    }, 1000);
  }
}