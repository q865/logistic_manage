import type { Delivery } from '../models/Delivery';
import { ExcelParserService } from './excelParserService.js';

export class DeliveryService {
  private deliveries: Delivery[] = [];
  
  /**
   * Загружает данные из Excel файла
   */
  async loadFromExcel(fileBuffer: Buffer | Uint8Array): Promise<Delivery[]> {
    try {
      const parsedDeliveries = await ExcelParserService.parseDeliveryExcel(fileBuffer);
      
      // Валидируем каждую доставку
      const validDeliveries = parsedDeliveries.filter(delivery => 
        ExcelParserService.validateDelivery(delivery)
      );
      
      // Добавляем временные метки
      const deliveriesWithTimestamps = validDeliveries.map(delivery => ({
        ...delivery,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      this.deliveries = deliveriesWithTimestamps;
      
      console.log(`Загружено ${validDeliveries.length} доставок из Excel файла`);
      return deliveriesWithTimestamps;
    } catch (error) {
      console.error('Ошибка загрузки Excel файла:', error);
      throw error;
    }
  }
  
  /**
   * Получает все доставки
   */
  async getAllDeliveries(): Promise<Delivery[]> {
    return this.deliveries;
  }
  
  /**
   * Получает доставки по дате
   */
  async getDeliveriesByDate(date: string): Promise<Delivery[]> {
    return this.deliveries.filter(delivery => 
      delivery.deliveryDate === date || delivery.orderDate === date
    );
  }
  
  /**
   * Получает доставки по времени погрузки
   */
  async getDeliveriesByLoadingTime(time: string): Promise<Delivery[]> {
    return this.deliveries.filter(delivery => 
      delivery.orderTime.startsWith(time)
    );
  }
  
  /**
   * Получает текущие рейсы (доставки на сегодня)
   */
  async getCurrentDeliveries(): Promise<Delivery[]> {
    const today = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return this.deliveries.filter(delivery => 
      delivery.deliveryDate === today
    );
  }
  
  /**
   * Получает статистику по грузам
   */
  async getCargoStatistics(): Promise<{
    totalVolume: number;
    totalWeight: number;
    totalDeliveries: number;
    averageVolume: number;
    averageWeight: number;
  }> {
    if (this.deliveries.length === 0) {
      return {
        totalVolume: 0,
        totalWeight: 0,
        totalDeliveries: 0,
        averageVolume: 0,
        averageWeight: 0
      };
    }
    
    const totalVolume = this.deliveries.reduce((sum, delivery) => sum + delivery.cargoVolume, 0);
    const totalWeight = this.deliveries.reduce((sum, delivery) => sum + delivery.cargoWeight, 0);
    const totalDeliveries = this.deliveries.length;
    
    return {
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalWeight,
      totalDeliveries,
      averageVolume: Math.round((totalVolume / totalDeliveries) * 100) / 100,
      averageWeight: Math.round(totalWeight / totalDeliveries)
    };
  }
  
  /**
   * Поиск доставок по клиенту
   */
  async searchDeliveriesByCustomer(customerName: string): Promise<Delivery[]> {
    const searchTerm = customerName.toLowerCase();
    return this.deliveries.filter(delivery =>
      delivery.customerName.toLowerCase().includes(searchTerm)
    );
  }
  
  /**
   * Получает расписание доставок на определенную дату
   */
  async getDeliverySchedule(date: string): Promise<Delivery[]> {
    const dayDeliveries = this.deliveries.filter(delivery => 
      delivery.deliveryDate === date
    );
    
    // Сортируем по времени доставки
    return dayDeliveries.sort((a, b) => 
      a.deliveryTime.localeCompare(b.deliveryTime)
    );
  }
  
  /**
   * Очищает все данные о доставках
   */
  async clearDeliveries(): Promise<void> {
    this.deliveries = [];
    console.log('Все данные о доставках очищены');
  }
  
  /**
   * Экспортирует данные в JSON
   */
  async exportToJson(): Promise<string> {
    return JSON.stringify(this.deliveries, null, 2);
  }
}
