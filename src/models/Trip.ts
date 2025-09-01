export enum TripStatus {
  Review = 'review',          // На проверке
  WithDriver = 'with_driver', // У водителя
  Rework = 'rework',          // На доработке
  Lost = 'lost',              // Утеряны
  Verified = 'verified',      // Проверены
}

export interface Trip {
  id?: number;
  driver_id: number; // ID водителя, к которому привязан рейс
  delivery_id: number | null; // ID доставки, если привязана к конкретной доставке
  route_info: string; // Информация о маршруте (например, из Excel)
  status: TripStatus; // Текущий статус рейса
  notes: string | null; // Дополнительные заметки
  created_at?: Date;
  updated_at?: Date;
}
