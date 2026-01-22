import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Patient } from '../models/patient.model';
import { PatientSearchComponent } from '../component/reception/patient-search.component';
import { PatientDetailsComponent } from '../component/reception/patient-details.component';
@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(MatDialog);

  openPatientSearch(): Promise<Patient | undefined> {
    const dialogRef = this.dialog.open(PatientSearchComponent, {
      width: '1000px',
      maxHeight: '80vh',
      disableClose: false,
      data: { isDialog: true }
    });

    return dialogRef.afterClosed().toPromise();
  }

  openPatientDetails(patient: Patient): void {
    import('../component/reception/patient-details.component').then(module => {
      this.dialog.open(module.PatientDetailsComponent, {
        width: '800px',
        maxHeight: '90vh',
        data: { patient }
      });
    });
  }
}