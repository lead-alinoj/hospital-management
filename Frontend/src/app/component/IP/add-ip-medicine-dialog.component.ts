import { Component, Inject, inject,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PrescriptionService } from '../../service/prescription.service';
import { MedicineService } from '../../service/medicine.service';
import { AuthService } from '../../auth/auth.service';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-add-ip-medicine-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatOptionModule
  ],
  template: `
    <div class="add-ip-medicine-dialog">
      <h2 mat-dialog-title>Add Items for IP Patient</h2>
      
      <mat-dialog-content>
        <div class="patient-info">
          <h3>{{ data.patient?.fullName }}</h3>
          <p>OP: {{ data.patient?.opNumber }} | Room: {{ data.bedInfo }}</p>
          <p><strong>Bill to:</strong> IP Visit</p>
        </div>
        
        <div class="item-type-tabs">
          <mat-button-toggle-group [(value)]="selectedItemType" (change)="onItemTypeChange($event)">
            <mat-button-toggle value="Medicine">Medicines</mat-button-toggle>
            <mat-button-toggle value="Consumable">Consumables</mat-button-toggle>
          
          </mat-button-toggle-group>
        </div>
        
        <form [formGroup]="medicineForm">
          <div formArrayName="items">
            <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" class="item-row">
              
              <div class="item-grid">
                <!-- Item Selection -->
                <mat-form-field appearance="outline" class="item-name">
                  <mat-label>{{ getItemTypeLabel() }}</mat-label>
<input matInput
       formControlName="name"
       [matAutocomplete]="auto"
       placeholder="Search or type item..."
       (input)="filterAutocomplete($any($event.target).value)">


                  <mat-autocomplete #auto="matAutocomplete"
                    [displayWith]="displayItem"
                    (optionSelected)="onItemSelected($event.option.value, i)">
                    <mat-option *ngFor="let item of filteredItems$ | async" [value]="item">
                      <div class="option-row">
                        <span>{{ item.name }}</span>
                        <small *ngIf="item.genericName">({{ item.genericName }})</small>
                        <small *ngIf="item.strength">{{ item.strength }}{{ item.unit }}</small>
                        <small [style.color]="getStockColor(item.stockQty, item.minStock)">
                          Stock: {{ item.stockQty }}
                        </small>
                        <small>₹{{ item.price || 0 }}</small>
                      </div>
                    </mat-option>
                  </mat-autocomplete>
                </mat-form-field>
                
                <!-- Quantity -->
                <mat-form-field appearance="outline" class="item-qty">
                  <mat-label>Qty</mat-label>
                  <input matInput type="number" formControlName="quantity" min="1">
                </mat-form-field>
                
                <!-- Price per unit -->
                <mat-form-field appearance="outline" class="item-price">
                  <mat-label>Unit Price (₹)</mat-label>
                  <input matInput type="number" step="0.01" formControlName="unitPrice" min="0">
                </mat-form-field>
                
                <!-- Total Price (calculated) -->
                <mat-form-field appearance="outline" class="item-total" disabled>
                  <mat-label>Total (₹)</mat-label>
                  <input matInput [value]="calculateTotal(i)" readonly>
                </mat-form-field>
                
                <!-- Remove button -->
                <button mat-icon-button color="warn" 
                        (click)="removeItem(i)" 
                        class="remove-btn">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              
              <!-- Additional fields based on item type -->
              <div class="item-details">
                <mat-form-field appearance="outline" class="full-width" *ngIf="selectedItemType === 'Medicine'">
                  <mat-label>Frequency</mat-label>
                  <mat-select formControlName="frequency">
                    <mat-option value="OD">Once Daily (OD)</mat-option>
                    <mat-option value="BD">Twice Daily (BD)</mat-option>
                    <mat-option value="TDS">Thrice Daily (TDS)</mat-option>
                    <mat-option value="QID">Four Times (QID)</mat-option>
                    <mat-option value="PRN">As Required (PRN)</mat-option>
                    <mat-option value="SOS">If Needed (SOS)</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width" *ngIf="selectedItemType === 'Medicine'">
                  <mat-label>Days</mat-label>
                  <input matInput type="number" formControlName="days" min="1">
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Instructions / Notes</mat-label>
                  <input matInput formControlName="instructions" placeholder="Special instructions...">
                </mat-form-field>
              </div>
            </div>
          </div>
          
          <button mat-button type="button" (click)="addItem()" class="add-btn">
            <mat-icon>add</mat-icon> Add Another {{ getItemTypeLabel() }}
          </button>
        </form>
        
        <!-- Summary Section -->
        <div class="summary-section">
          <h4>Summary</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span>Total Items:</span>
              <span>{{ items.length }}</span>
            </div>
            <div class="summary-item">
              <span>Total Quantity:</span>
              <span>{{ getTotalQuantity() }}</span>
            </div>
            <div class="summary-item total">
              <strong>Total Amount:</strong>
              <strong>₹{{ getTotalAmount() | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
        
        <div class="administered-by">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Administered By</mat-label>
            <mat-select formControlName="administeredBy">
              <mat-option value="Nurse">Nurse</mat-option>
              <mat-option value="Doctor">Doctor</mat-option>
              <mat-option value="Reception">Reception</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions>
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                (click)="onSubmit()"
                [disabled]="medicineForm.invalid || items.length === 0">
          Add Items to IP Bill
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .add-ip-medicine-dialog { min-width: 800px; max-width: 1000px; }
    .patient-info { 
      background: #f5f5f5; 
      padding: 15px; 
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .item-type-tabs {
      margin-bottom: 20px;
    }
    .item-row { 
      padding: 15px; 
      border: 1px solid #eee; 
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .item-grid {
      display: grid;
      grid-template-columns: 2fr 80px 120px 120px 40px;
      gap: 10px;
      margin-bottom: 10px;
      align-items: center;
    }
    .item-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .full-width { width: 100%; }
    .add-btn { margin: 10px 0 20px; }
    .summary-section { 
      margin: 20px 0; 
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #ddd;
    }
    .summary-item.total {
      border-top: 2px solid #333;
      margin-top: 10px;
      padding-top: 10px;
    }
    .administered-by { margin-top: 20px; }
    .option-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .option-row small {
      font-size: 11px;
      color: #666;
    }
  `]
})
export class AddIpMedicineDialogComponent{
  private fb = inject(FormBuilder);
  private medicineService = inject(MedicineService);
  private prescriptionService = inject(PrescriptionService);
  private authService = inject(AuthService);

  medicineForm: FormGroup;
  allItems: any[] = [];
  visibleItems: any[] = [];   // filtered list

  filteredItems$!: Observable<any[]>;
  selectedItemType: 'Medicine' | 'Consumable' = 'Medicine';

constructor(
  public dialogRef: MatDialogRef<AddIpMedicineDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: any
) {
  this.medicineForm = this.fb.group({
    items: this.fb.array([]),
    administeredBy: ['Nurse', Validators.required],
    notes: ['']
  });
  
  // Initialize filteredItems$ with an empty observable
  this.filteredItems$ = of([]);
  
  // Load items and add initial item
  this.loadItems();
  this.addItem();
}
filterAutocomplete(value: string): void {
  const searchTerm = (value || '').toLowerCase().trim();

  this.filteredItems$ = of(
    this.visibleItems.filter(item =>
      item.name?.toLowerCase().includes(searchTerm) ||
      item.genericName?.toLowerCase().includes(searchTerm) ||
      item.brandName?.toLowerCase().includes(searchTerm)
    )
  );
}

private applyCategoryFilter(): void {
  // Map selected item type to category type
  const categoryMap = {
    'Medicine': 'Medicine',
    'Consumable': 'Consumable'
  };
  
  const targetCategory = categoryMap[this.selectedItemType];
  
  if (targetCategory) {
    this.visibleItems = this.allItems.filter(item => {
      // Check multiple possible locations for category type
      const categoryType = 
        item.category?.type || 
        item.categoryType || 
        (item.category && typeof item.category === 'string' ? item.category : null);
      
      console.log(`🔍 Filtering: ${item.name} - Category Type: ${categoryType} - Target: ${targetCategory}`);
      
      return categoryType === targetCategory;
    });
  } else {
    this.visibleItems = this.allItems;
  }
  
  console.log(`✅ Filtered to ${this.visibleItems.length} ${this.selectedItemType}(s)`);
}

private loadItems(): void {
  this.medicineService.getBillableItems().subscribe({
    next: (response: any) => {
      console.log('🟢 API Response:', response);
      this.allItems = response.data || [];
      
      console.log('📊 All items loaded:', this.allItems.length);
      console.log('📝 Sample item:', this.allItems[0]);
      
      // Check category structure
      if (this.allItems.length > 0) {
        const sample = this.allItems[0];
        console.log('🔍 Category structure:', {
          category: sample.category,
          categoryType: sample.categoryType,
          hasCategory: !!sample.category,
          categoryTypeFromCategory: sample.category?.type
        });
      }
      
      // Filter items based on selected type
      this.applyCategoryFilter();
      
      console.log('✅ Visible items after filter:', this.visibleItems.length);
      
      // Initialize filtered items
      this.filteredItems$ = of(this.visibleItems);
    },
    error: (error) => {
      console.error('❌ Error loading items:', error);
      this.allItems = [];
      this.visibleItems = [];
      this.filteredItems$ = of([]);
    }
  });
}




removeItem(index: number): void {
  this.items.removeAt(index);

  // refresh autocomplete list
  this.filteredItems$ = of(this.visibleItems);
}


  get items() {
    return this.medicineForm.get('items') as FormArray;
  }

  getItemTypeLabel(): string {
    switch(this.selectedItemType) {
      case 'Medicine': return 'Medicine';
      case 'Consumable': return 'Consumable';
  
      default: return 'Item';
    }
  }
onItemTypeChange(event: any): void {
  this.selectedItemType = event.value;
  
  // Update category type for all existing items
  this.items.controls.forEach((control, index) => {
    const currentValue = control.value;
    control.patchValue({
      categoryType: this.selectedItemType,
      // Reset itemId when changing type
      itemId: null,
      name: '',
      unitPrice: 0
    });
  });
  
  // Reload filtered items
  this.applyCategoryFilter();
  this.filteredItems$ = of(this.visibleItems);
}


addItem(): void {
  const itemGroup = this.fb.group({
    itemId: [null],
    name: ['', Validators.required],
    categoryType: [this.selectedItemType],
    quantity: [1, Validators.required],
    unitPrice: [0],
    frequency: ['BD'],
    days: [1],
    instructions: [''],
    isIPItem: [true]
  });

  this.items.push(itemGroup);

  this.filteredItems$ = of(this.visibleItems);
}


 displayItem(item: any): string {
  if (!item) return '';
  
  if (typeof item === 'string') {
    return item;
  }
  
  return item.name || item.medicineName || '';
}

// Update onItemSelected to properly handle selections
onItemSelected(selectedItem: any, index: number): void {
  const itemGroup = this.items.at(index);
  
  if (!selectedItem || typeof selectedItem === 'string') {
    // User typed manually
    itemGroup.patchValue({
      itemId: null,
      name: selectedItem || '',
      unitPrice: 0
    });
    return;
  }
  
  // Item selected from dropdown
  const price = selectedItem.price || selectedItem.unitPrice || 0;
  
  itemGroup.patchValue({
    itemId: selectedItem._id,
    name: selectedItem.name || selectedItem.medicineName,
    unitPrice: price,
    // Auto-set default quantity
    quantity: 1
  });
}

  getStockColor(currentStock: number, minStock: number): string {
    if (currentStock === 0) return 'red';
    if (currentStock <= minStock) return 'orange';
    return 'green';
  }

  calculateTotal(index: number): number {
    const item = this.items.at(index).value;
    return item.quantity * item.unitPrice;
  }

  getTotalQuantity(): number {
    return this.items.value.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  }

  getTotalAmount(): number {
    return this.items.value.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice || 0), 0
    );
  }

onSubmit(): void {
  if (this.medicineForm.invalid) return;
  
  const itemsData = this.items.value.map((item: any) => ({
    itemId: item.itemId,
    name: item.name,
    categoryType: this.selectedItemType,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice,
    frequency: item.frequency,
    days: item.days,
    instructions: item.instructions,
    isIPItem: true
  }));

  const billData = {
    visitId: this.data.visitId,
    items: itemsData,
    totalAmount: this.getTotalAmount(),
    administeredBy: this.medicineForm.value.administeredBy
  };

  this.medicineService.addIPBillItems(billData).subscribe({
    next: (response: any) => {
      if (response.success) {
        this.dialogRef.close({ 
          success: true, 
          data: response.data,
          billAmount: this.getTotalAmount()
        });
      }
    },
    error: (err) => {
      console.error('Error adding bill items:', err);
      alert('Failed to add bill items');
    }
  });
}

validateBillItems(): boolean {
  for (let i = 0; i < this.items.length; i++) {
    const item = this.items.at(i).value;
    if (!item.name) {
      alert(`Item ${i + 1}: Name is required`);
      return false;
    }
    if (!item.quantity || item.quantity < 1) {
      alert(`Item ${i + 1}: Quantity must be at least 1`);
      return false;
    }
  }
  return true;
}

  onCancel(): void {
    this.dialogRef.close();
  }
}