// src/models/Driver.ts

// Личные данные
interface PersonalData {
  lastName: string;          // Фамилия
  firstName: string;         // Имя
  patronymic?: string;       // Отчество (не у всех есть)
  birthDate: Date;           // Дата рождения
}

// Паспортные данные
interface Passport {
  series: string;            // Серия
  number: string;            // Номер
  issuedBy: string;          // Кем выдан
  issueDate: Date;           // Дата выдачи
  departmentCode: string;    // Код подразделения
  registrationAddress: string; // Адрес прописки
}

// Данные по автомобилю
interface Vehicle {
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

// Полная карточка водителя
export interface Driver {
  id: number;                // Уникальный ID в базе
  personalData: PersonalData;
  passport: Passport;
  vehicle: Vehicle;
  createdAt: Date;           // Дата создания записи
}
