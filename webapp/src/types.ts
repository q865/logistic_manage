// webapp/src/types.ts

import type { Dayjs } from 'dayjs';

export interface PersonalData {
  lastName: string;
  firstName: string;
  patronymic?: string;
  birthDate: Dayjs | null;
}

export interface Passport {
  series: string;
  number: string;
  issuedBy: string;
  issueDate: Dayjs | null;
  departmentCode: string;
  registrationAddress?: string;
}

export interface Vehicle {
  make: string;
  model: string;
  licensePlate: string;
  vin: string;
  year: string; // Используем строку для инпута, преобразуем в число при отправке
  type: string;
  chassis?: string;
  bodyColor: string;
  bodyNumber?: string;
  ptsNumber: string;
  stsNumber: string;
  stsIssueInfo: string;
}

export interface DriverLicense {
  series?: string;
  number?: string;
  issueDate?: Dayjs | null;
  expiryDate?: Dayjs | null;
  categories?: string;
}

export interface LeaseAgreement {
  number?: string;
  date?: Dayjs | null;
}

export interface Driver {
  id: number;
  personalData: PersonalData;
  passport: Passport;
  vehicle: Vehicle;
  driverLicense?: DriverLicense;
  leaseAgreement?: LeaseAgreement;
  createdAt: string; // Даты приходят как строки ISO
  updatedAt: string;
}