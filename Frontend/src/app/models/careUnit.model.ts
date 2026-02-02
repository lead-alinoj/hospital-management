import { Bed } from './bed.model';

export interface CareUnit {
  _id: string;
  unitNumber: string;        // WARD-1, ROOM-1
  name: string;              // General Ward, Private Room
  category: 'Ward' | 'Room';
  capacity: number;
  chargesPerDay?: number;
  floor?: string;
  isActive: boolean;

  // populated from backend
  beds?: Bed[];
  availableBeds?: number;
  occupiedBeds?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCareUnitRequest {
  unitNumber: string;
  name: string;
  category: 'Ward' | 'Room';
  capacity: number;
  chargesPerDay?: number;
  floor?: string;
}

export interface CareUnitResponse {
  success: boolean;
  data: CareUnit | CareUnit[];
  message?: string;
}
