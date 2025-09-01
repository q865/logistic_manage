import ExcelJS from 'exceljs';
import type { Delivery, CargoDetails, OrderInfo, DeliveryInfo } from '../models/Delivery';

export class ExcelParserService {
  
  /**
   * Парсит Excel файл и извлекает данные о доставках
   */
  static async parseDeliveryExcel(fileBuffer: Buffer | Uint8Array): Promise<Delivery[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);
      
      const worksheet = workbook.getWorksheet(1); // Получаем первый лист
      if (!worksheet) {
        throw new Error('Лист не найден в Excel файле');
      }
      
      const deliveries: Delivery[] = [];
      
      // Парсим каждую строку
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Пропускаем заголовок
        
        const rowData = row.values as any[];
        console.log(`Строка ${rowNumber}:`, rowData);
        
        if (!rowData || rowData.length === 0 || !rowData[1]) {
          console.log(`Строка ${rowNumber} пустая, пропускаем`);
          return;
        }
        
        try {
          const delivery = this.parseRow(rowData);
          if (delivery) {
            console.log(`Строка ${rowNumber} успешно распарсена:`, delivery);
            deliveries.push(delivery);
          } else {
            console.log(`Строка ${rowNumber} не прошла валидацию`);
          }
        } catch (error) {
          console.error(`Ошибка парсинга строки ${rowNumber}:`, error);
        }
      });
      
      return deliveries;
    } catch (error) {
      console.error('Ошибка парсинга Excel файла:', error);
      throw new Error('Не удалось распарсить Excel файл');
    }
  }
  
  /**
   * Парсит отдельную строку Excel
   */
  private static parseRow(rowData: any[]): Delivery | null {
    if (rowData.length < 5) return null; // exceljs индексирует с 1, поэтому нужно 5 элементов
    
    // Данные уже разбиты по ячейкам (индексы начинаются с 1)
    const identifier = rowData[1];
    const cargoData = rowData[2];
    const orderAndCustomerData = rowData[3];
    const company = rowData[4];
    
    if (!identifier || !cargoData || !orderAndCustomerData || !company) {
      return null;
    }
    
    // Парсим детали груза
    const cargoMatch = cargoData.toString().match(/(\d+\.?\d*)\s*куб\.м\/(\d+)\s*кг\/(\d+\.?\d*)\s*м\/([^/]+)/);
    if (!cargoMatch) return null;
    
    const cargoDetails: CargoDetails = {
      volume: parseFloat(cargoMatch[1] || '0'),
      weight: parseInt(cargoMatch[2] || '0'),
      length: parseFloat(cargoMatch[3] || '0'),
      additionalInfo: (cargoMatch[4] || '').trim()
    };
    
    // Парсим информацию о заказе и клиенте
    // Формат: "13908.Заказано.01.09.2025 00:00:00.Кулушов Марат Шайлообаевич........01.09.2025 01:30:00..202"
    
    const orderAndCustomerStr = orderAndCustomerData.toString();
    
    // Сначала парсим номер заказа и время
    const orderMatch = orderAndCustomerStr.match(/(\d+)\.Заказано\.(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})/);
    if (!orderMatch) {
      console.log('Order match failed for:', orderAndCustomerStr);
      return null;
    }
    
    // Парсим имя клиента (между временем заказа и точками)
    const nameMatch = orderAndCustomerStr.match(/Заказано\.\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\.([А-Яа-я\s]+?)\.{8,}/);
    if (!nameMatch) {
      console.log('Name match failed for:', orderAndCustomerStr);
      return null;
    }
    
    // Парсим информацию о доставке
    const deliveryMatch = orderAndCustomerStr.match(/\.{8,}(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})\.\.(\d+)/);
    if (!deliveryMatch) {
      console.log('Delivery match failed for:', orderAndCustomerStr);
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
      company: company.toString()
    };
    
    return {
      identifier: identifier.toString(),
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
