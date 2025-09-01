export interface Delivery {
  id?: number;
  identifier: string; // DD.MM.YY_NN_XXX_YYY_ZZ
  cargoVolume: number; // куб.м
  cargoWeight: number; // кг
  cargoLength: number; // м
  cargoAdditionalInfo: string; // дополнительная информация о грузе
  orderNumber: number; // номер заказа
  orderStatus: string; // статус заказа (обычно "Заказано")
  orderDate: string; // дата заказа DD.MM.YYYY
  orderTime: string; // время заказа HH:MM:SS (время погрузки)
  customerName: string; // ФИО клиента
  deliveryDate: string; // дата доставки DD.MM.YYYY
  deliveryTime: string; // время доставки HH:MM:SS
  deliveryId: number; // ID доставки
  companyName: string; // название компании (ООО "ГРУЗ СЕРВИС")
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CargoDetails {
  volume: number;
  weight: number;
  length: number;
  additionalInfo: string;
}

export interface OrderInfo {
  number: number;
  status: string;
  date: string;
  time: string;
}

export interface DeliveryInfo {
  date: string;
  time: string;
  id: number;
  company: string;
}
