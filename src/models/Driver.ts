// src/models/Driver.ts

// Личные данные
export interface PersonalData {
  lastName: string;          // Фамилия
  firstName: string;         // Имя
  patronymic?: string;       // Отчество (не у всех есть)
  birthDate: Date;           // Дата рождения
}

// Паспортные данные
export interface Passport {
  series: string;            // Серия
  number: string;            // Номер
  issuedBy: string;          // Кем выдан
  issueDate: Date;           // Дата выдачи
  departmentCode: string;    // Код подразделения
  registrationAddress: string; // Адрес прописки
}

// Данные по автомобилю
export interface Vehicle {
  make: string;              // Марка
  model: string;             // Модель
  licensePlate: string;      // Регистрационный знак
  vin: string;               // VIN
  year: number;              // Год выпуска
  type: string;              // Тип ТС
  chassis?: string;          // Шасси (рама)
  bodyColor: string;         // Цвет кузова
  bodyNumber?: string;       // Номер кузова (кабины, прицепа)
  ptsNumber: string;         // Номер ПТС
  stsNumber: string;         // Номер СТС
  stsIssueInfo: string;      // СТС: когда и кем выдан
}

// Водительское удостоверение
export interface DriverLicense {
  series?: string;           // Серия ВУ
  number?: string;           // Номер ВУ
  issueDate?: Date;          // Дата выдачи
  expiryDate?: Date;         // Срок действия
  categories?: string;       // Категории
}

// Договор аренды
export interface LeaseAgreement {
  number?: string;           // Номер договора
  date?: Date;               // Дата заключения
}

// Полная карточка водителя
export interface Driver {
  id: number;                // Уникальный ID в базе
  personalData: PersonalData;
  passport: Passport;
  vehicle: Vehicle;
  driverLicense?: DriverLicense;
  leaseAgreement?: LeaseAgreement;
  createdAt: Date;           // Дата создания записи
  updatedAt: Date;           // Дата обновления записи
}

// Тип для создания нового водителя (без id и дат)
export type NewDriver = Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>;
