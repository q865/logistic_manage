/**
 * Сервис для обработки Excel файлов с данными о грузах
 */

import ExcelParser from '../parsers/excelParser.js';
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

  constructor() {
    this.deliveryService = new DeliveryService();
  }

  /**
   * Обрабатывает Excel файл и извлекает данные о грузах
   * @param fileBuffer - буфер с содержимым Excel файла
   * @returns Promise<ProcessingResponse> - массив распарсенных данных
   */
  async processExcelFile(fileBuffer: Buffer): Promise<ProcessingResponse> {
    try {
      // Здесь будет логика чтения Excel файла
      // Пока используем тестовые данные для демонстрации
      const mockExcelData = this.getMockExcelData();
      
      const results: ProcessingResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (const row of mockExcelData) {
        try {
          const parsedData = ExcelParser.parseRow(row);
          
                  if (parsedData && ExcelParser.validate(parsedData)) {
          // Сохраняем в базу данных
          const delivery = await this.saveDeliveryToDatabase(parsedData);
          results.push({
            success: true,
            data: parsedData,
            deliveryId: delivery?.id,
            formatted: ExcelParser.format(parsedData)
          });
          successCount++;
        } else {
            results.push({
              success: false,
              error: 'Данные не прошли валидацию',
              rawData: row
            });
            errorCount++;
          }
        } catch (error: any) {
          results.push({
            success: false,
            error: `Ошибка парсинга: ${error?.message || 'Неизвестная ошибка'}`,
            rawData: row
          });
          errorCount++;
        }
      }

      return {
        results,
        summary: {
          total: mockExcelData.length,
          success: successCount,
          error: errorCount
        }
      };

    } catch (error: any) {
      throw new Error(`Ошибка обработки Excel файла: ${error?.message || 'Неизвестная ошибка'}`);
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
   * Форматирует результаты обработки для вывода в Telegram
   * @param results - результаты обработки
   * @returns string - отформатированный текст
   */
  formatProcessingResults(results: ProcessingResponse): string {
    const { summary } = results;
    
    let text = `📊 **Результаты обработки Excel файла**\n\n`;
    text += `📁 **Всего строк**: ${summary.total}\n`;
    text += `✅ **Успешно обработано**: ${summary.success}\n`;
    text += `❌ **Ошибок**: ${summary.error}\n\n`;

    if (summary.success > 0) {
      text += `🎯 **Успешно обработанные заказы:**\n`;
      results.results
        .filter((r: ProcessingResult) => r.success)
        .forEach((result: ProcessingResult, index: number) => {
          if (result.data) {
            text += `${index + 1}. Заказ №${result.data.order.orderNumber}\n`;
            text += `   Клиент: ${result.data.order.customerName}\n`;
            text += `   Груз: ${result.data.cargo.volume} куб.м, ${result.data.cargo.weight} кг\n`;
            text += `   Маршрут: ${result.data.route.date} ${result.data.route.region}\n\n`;
          }
        });
    }

    if (summary.error > 0) {
      text += `⚠️ **Строки с ошибками:**\n`;
      results.results
        .filter((r: ProcessingResult) => !r.success)
        .forEach((result: ProcessingResult, index: number) => {
          text += `${index + 1}. ${result.error}\n`;
        });
    }

    return text;
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
