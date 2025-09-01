import * as XLSX from 'xlsx';
import type { Delivery, CargoDetails, OrderInfo, DeliveryInfo } from '../models/Delivery';

export class ExcelParserService {
  
  /**
   * Парсит Excel файл и извлекает данные о доставках
   */
  static parseDeliveryExcel(fileBuffer: Buffer): Delivery[] {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Лист не найден в Excel файле');
      }
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        throw new Error('Лист не найден в Excel файле');
      }
      
      // Конвертируем в JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const deliveries: Delivery[] = [];
      
      // Парсим каждую строку
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        console.log(`Строка ${i + 1}:`, row);
        
        if (row.length === 0 || !row[0]) {
          console.log(`Строка ${i + 1} пустая, пропускаем`);
          continue;
        }
        
        try {
          const delivery = this.parseRow(row);
          if (delivery) {
            console.log(`Строка ${i + 1} успешно распарсена:`, delivery);
            deliveries.push(delivery);
          } else {
            console.log(`Строка ${i + 1} не прошла валидацию`);
          }
        } catch (error) {
          console.error(`Ошибка парсинга строки ${i + 1}:`, error);
          continue;
        }
      }
      
      return deliveries;
    } catch (error) {
      console.error('Ошибка парсинга Excel файла:', error);
      throw new Error('Не удалось распарсить Excel файл');
    }
  }
  
  /**
   * Парсит отдельную строку Excel
   */
  private static parseRow(row: any[]): Delivery | null {
    if (row.length < 4) return null;
    
    // Данные уже разбиты по ячейкам
    const identifier = row[0];
    const cargoData = row[1];
    const orderAndCustomerData = row[2];
    const company = row[3];
    
    if (!identifier || !cargoData || !orderAndCustomerData || !company) {
      return null;
      
    }
    
    // Парсим детали груза
    const cargoMatch = cargoData.match(/(\d+\.?\d*)\s*куб\.м\/(\d+)\s*кг\/(\d+\.?\d*)\s*м\/([^/]+)/);
    if (!cargoMatch) return null;
    
    const cargoDetails: CargoDetails = {
      volume: parseFloat(cargoMatch[1] || '0'),
      weight: parseInt(cargoMatch[2] || '0'),
      length: parseFloat(cargoMatch[3] || '0'),
      additionalInfo: (cargoMatch[4] || '').trim()
    };
    
    // Парсим информацию о заказе и клиенте
    // Формат: "13908.Заказано.01.09.2025 00:00:00.Кулушов Марат Шайлообаевич........01.09.2025 01:30:00..202"
    
    // Сначала парсим номер заказа и время
    const orderMatch = orderAndCustomerData.match(/(\d+)\.Заказано\.(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})/);
    if (!orderMatch) {
      console.log('Order match failed for:', orderAndCustomerData);
      return null;
    }
    
    // Парсим имя клиента (между временем заказа и точками)
    const nameMatch = orderAndCustomerData.match(/Заказано\.\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\.([А-Яа-я\s]+?)\.{8,}/);
    if (!nameMatch) {
      console.log('Name match failed for:', orderAndCustomerData);
      return null;
    }
    
    // Парсим информацию о доставке
    const deliveryMatch = orderAndCustomerData.match(/\.{8,}(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})\.\.(\d+)/);
    if (!deliveryMatch) {
      console.log('Delivery match failed for:', orderAndCustomerData);
      return null;
    }
    
    const orderInfo: OrderInfo = {
      number: parseInt(orderMatch[1] || '0'),
      status: 'Заказано',
      date: orderMatch[2] || '',
      time: orderMatch[3] || ''
    };
    
    const customerName = (nameMatch[1] || '').trim();
    
    const deliveryInfo: DeliveryInfo = {
      date: deliveryMatch[1] || '',
      time: deliveryMatch[2] || '',
      id: parseInt(deliveryMatch[3] || '0'),
      company: company
    };
    
    return {
      identifier: identifier,
      cargoVolume: cargoDetails.volume,
      cargoWeight: cargoDetails.weight,
      cargoLength: cargoDetails.length,
      cargoAdditionalInfo: cargoDetails.additionalInfo,
      orderNumber: orderInfo.number,
      orderStatus: orderInfo.status,
      orderDate: orderInfo.date,
      orderTime: orderInfo.time,
      customerName,
      deliveryDate: deliveryInfo.date,
      deliveryTime: deliveryInfo.time,
      deliveryId: deliveryInfo.id,
      companyName: deliveryInfo.company
    };
  }
  
  /**
   * Валидирует данные доставки
   */
  static validateDelivery(delivery: Delivery): boolean {
    return !!(
      delivery.identifier &&
      delivery.cargoVolume > 0 &&
      delivery.cargoWeight > 0 &&
      delivery.cargoLength > 0 &&
      delivery.orderNumber > 0 &&
      delivery.orderDate &&
      delivery.orderTime &&
      delivery.customerName &&
      delivery.deliveryDate &&
      delivery.deliveryTime &&
      delivery.deliveryId > 0
    );
  }
  
  /**
   * Форматирует дату из DD.MM.YYYY в YYYY-MM-DD
   */
  static formatDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('.');
    if (!day || !month || !year) {
      throw new Error('Неверный формат даты');
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  /**
   * Форматирует время из HH:MM:SS в HH:MM
   */
  static formatTime(timeStr: string): string {
    return timeStr.substring(0, 5);
  }
}
