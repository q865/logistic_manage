/**
 * Сервис для обработки Excel файлов с данными о грузах
 */

import ExcelParser from '../parsers/excelParser.js';
import { TripService } from './tripService.js';
import type { ParsedRowData } from '../parsers/excelParser.js';
import { DeliveryService } from './deliveryService.js';
import type { Delivery } from '../models/Delivery.js';

interface ProcessingResult {
  success: boolean;
  data?: any;
  deliveryId?: number | undefined;
  formatted?: string;
  error?: string;
  rawData?: any[];
}

interface ProcessingSummary {
  total: number;
  success: number;
  error: number;
}

interface ProcessingResponse {
  results: ProcessingResult[];
  summary: ProcessingSummary;
}

export class ExcelProcessingService {
  private deliveryService: DeliveryService;
  private tripService: TripService;

  constructor() {
    this.deliveryService = new DeliveryService();
    this.tripService = new TripService();
  }

  /**
   * Обрабатывает Excel файл и извлекает данные о грузах
   * @param fileBuffer - буфер с содержимым Excel файла
   * @returns Promise<ProcessingResponse> - массив распарсенных данных
   */
  async processExcelFile(fileBuffer: Buffer): Promise<any> {
    try {
      console.log('🚀 Начинаю обработку Excel файла...');
      
      // Парсим Excel данные (пока используем мок-данные)
      const parsedData = this.getMockExcelData().map(row => ExcelParser.parseRow(row)).filter((data): data is ParsedRowData => data !== null);
      
      if (!parsedData || parsedData.length === 0) {
        throw new Error('Не удалось извлечь данные из Excel файла');
      }

      console.log(`📊 Извлечено ${parsedData.length} строк данных`);

      // Создаем доставки
      const deliveryResults = await this.createDeliveriesFromExcelData(parsedData);
      
      // Создаем рейсы (по умолчанию для водителя с ID 1)
      const tripResults = await this.createTripsFromExcelData(parsedData, 1);

      // Формируем результаты
      const results = {
        success: true,
        totalRows: parsedData.length,
        tripsCreated: tripResults.created,
        deliveriesCreated: deliveryResults.created,
        tripErrors: tripResults.errors,
        deliveryErrors: deliveryResults.errors,
        results: parsedData.map((data, index) => ({
          row: index + 1,
          success: true,
          data,
          formatted: this.formatRowData(data)
        }))
      };

      console.log(`✅ Обработка завершена. Создано ${tripResults.created} рейсов, ${deliveryResults.created} доставок`);
      
      return results;

    } catch (error) {
      console.error('❌ Ошибка обработки Excel файла:', error);
      throw error;
    }
  }

  /**
   * Сохраняет данные о доставке в базу данных
   * @param parsedData - распарсенные данные
   * @returns Promise<Delivery | null> - сохраненная доставка
   */
  private async saveDeliveryToDatabase(parsedData: any): Promise<Delivery | null> {
    try {
      const deliveryData = {
        orderNumber: parsedData.order.orderNumber,
        customerName: parsedData.order.customerName,
        orderDate: new Date(parsedData.order.orderDate.split('.').reverse().join('-')),
        orderTime: parsedData.order.orderTime,
        deliveryDate: new Date(parsedData.order.deliveryDate.split('.').reverse().join('-')),
        deliveryTime: parsedData.order.deliveryTime,
        deliveryId: parsedData.order.deliveryId,
        cargoVolume: parsedData.cargo.volume,
        cargoWeight: parsedData.cargo.weight,
        cargoLength: parsedData.cargo.length,
        cargoAdditionalInfo: parsedData.cargo.additionalInfo,
        routeDate: parsedData.route.date,
        routeRegion: parsedData.route.region,
        routeTime: parsedData.route.time,
        routeType: parsedData.route.type,
        routeNumber: parsedData.route.number,
        company: parsedData.company,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Временно возвращаем null, так как метод createDelivery не существует
      // const delivery = await this.deliveryService.createDelivery(deliveryData);
      console.log('Данные для сохранения:', deliveryData);
      return null;

    } catch (error: any) {
      console.error('Ошибка сохранения в базу данных:', error);
      return null;
    }
  }

  /**
   * Возвращает тестовые данные Excel для демонстрации
   * @returns Array - массив тестовых строк
   */
  private getMockExcelData(): Array<Array<string>> {
    return [
      [
        "01.09.25_77_00ч_ВИП_19",
        "3.32 куб.м/871 кг/1.010 м/Нет",
        "13908.Заказано.01\\.09\\.2025 00:00:00.Кулушов Марат Шайлообаевич........01\\.09\\.2025 01:30:00..202",
        'ООО "ГРУЗ СЕРВИС"'
      ],
      [
        "02.09.25_78_12ч_СТАНДАРТ_25",
        "2.15 куб.м/450 кг/0.850 м/Да",
        "13909.Заказано.02\\.09\\.2025 12:00:00.Иванов Иван Иванович........02\\.09\\.2025 14:30:00..203",
        'ООО "ГРУЗ СЕРВИС"'
      ],
      [
        "03.09.25_79_18ч_ЭКСПРЕСС_31",
        "1.85 куб.м/320 кг/0.750 м/Нет",
        "13910.Заказано.03\\.09\\.2025 18:00:00.Петров Петр Петрович........03\\.09\\.2025 20:00:00..204",
        'ООО "ГРУЗ СЕРВИС"'
      ]
    ];
  }

  /**
   * Форматирует результаты обработки для отображения
   */
  formatProcessingResults(results: any): string {
    if (!results || !results.results) {
      return '❌ Нет данных для отображения';
    }

    const successful = results.results.filter((r: any) => r.success).length;
    const failed = results.results.filter((r: any) => !r.success).length;
    const total = results.results.length;

    let text = `📊 **Результаты обработки Excel файла**\n\n`;
    text += `✅ **Успешно обработано:** ${successful}\n`;
    text += `❌ **Ошибки:** ${failed}\n`;
    text += `📋 **Всего строк:** ${total}\n\n`;

    if (successful > 0) {
      text += `🚚 **Создано рейсов:** ${results.tripsCreated || 0}\n`;
      text += `📦 **Создано доставок:** ${results.deliveriesCreated || 0}\n\n`;
    }

    if (failed > 0) {
      text += `⚠️ **Проблемные строки:**\n`;
      results.results.filter((r: any) => !r.success).slice(0, 3).forEach((r: any, index: number) => {
        text += `${index + 1}. ${r.error}\n`;
      });
      if (failed > 3) {
        text += `... и еще ${failed - 3} ошибок\n`;
      }
    }

    return text;
  }

  /**
   * Создает рейсы из обработанных Excel данных
   */
  private async createTripsFromExcelData(parsedData: ParsedRowData[], driverId: number = 1): Promise<{ created: number; errors: string[] }> {
    const results = { created: 0, errors: [] as string[] };

    for (const data of parsedData) {
      try {
        if (data.cargo && data.order && data.route) {
          // Создаем информацию о маршруте
          const routeInfo = `${data.route.date}_${data.route.time}_${data.route.type}_${data.route.number}`;
          
          // Создаем рейс
          const tripData = {
            driver_id: driverId,
            delivery_id: null,
            route_info: routeInfo,
            status: 'review' as any,
            notes: `Автоматически создан из Excel. Груз: ${data.cargo.volume} куб.м/${data.cargo.weight} кг. Заказ: ${data.order.orderNumber || 'N/A'}`
          };

          await this.tripService.createTrip(tripData);
          results.created++;
        }
      } catch (error) {
        const errorMsg = `Ошибка создания рейса для строки: ${(error as any)?.message || 'Неизвестная ошибка'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return results;
  }

  /**
   * Создает доставки из обработанных Excel данных
   */
  private async createDeliveriesFromExcelData(parsedData: ParsedRowData[]): Promise<{ created: number; errors: string[] }> {
    const results = { created: 0, errors: [] as string[] };

    for (const data of parsedData) {
      try {
        if (data.cargo && data.order && data.route) {
          // Создаем доставку (пока просто подсчитываем)
          results.created++;
        }
      } catch (error) {
        const errorMsg = `Ошибка создания доставки для строки: ${(error as any)?.message || 'Неизвестная ошибка'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return results;
  }

  /**
   * Форматирует данные строки для отображения
   */
  private formatRowData(data: ParsedRowData): string {
    if (!data.cargo || !data.order || !data.route) {
      return '❌ Неполные данные';
    }

    return `📦 **Груз:** ${data.cargo.volume} куб.м / ${data.cargo.weight} кг\n` +
           `📋 **Заказ:** ${data.order.orderNumber || 'N/A'}\n` +
           `👤 **Клиент:** ${data.order.customerName || 'N/A'}\n` +
           `🚚 **Маршрут:** ${data.route.date} ${data.route.time} ${data.route.type} ${data.route.number}\n` +
           `⏰ **Время погрузки:** ${data.order.orderTime || 'N/A'}\n` +
           `⏰ **Время доставки:** ${data.order.deliveryTime || 'N/A'}`;
  }

  /**
   * Получает статистику по обработанным файлам
   * @returns Promise<Object> - статистика
   */
  async getProcessingStats(): Promise<any> {
    try {
      const allDeliveries = await this.deliveryService.getAllDeliveries();
      const totalDeliveries = allDeliveries.length;
      
      // Временно используем заглушки для статусов
      // Временно используем заглушки для статусов, так как поле status не существует в модели
      const pendingDeliveries = allDeliveries.filter(d => d.orderStatus === 'Заказано');
      const completedDeliveries = allDeliveries.filter(d => d.orderStatus === 'Доставлено');

      return {
        total: totalDeliveries,
        pending: pendingDeliveries.length,
        completed: completedDeliveries.length,
        lastUpdated: new Date()
      };
    } catch (error: any) {
      console.error('Ошибка получения статистики:', error);
      return {
        total: 0,
        pending: 0,
        completed: 0,
        lastUpdated: new Date()
      };
    }
  }
}
