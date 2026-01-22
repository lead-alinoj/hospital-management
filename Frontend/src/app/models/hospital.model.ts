export interface Hospital {
  _id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  registrationNumber?: string;
  logo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HospitalUpdateRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  logo?: string;
}