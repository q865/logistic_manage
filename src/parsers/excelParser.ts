/**
 * Парсер для данных из Excel файлов
 * Обрабатывает строки с информацией о грузах, заказах и доставке
 */

export interface ParsedCargo {
  volume: number;
  weight: number;
  length: number;
  additionalInfo: string;
}

export interface ParsedOrder {
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  customerName: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryId: string;
}

export interface ParsedRoute {
  date: string;
  region: string;
  time: string;
  type: string;
  number: string | null;
}

export interface ParsedRowData {
  route: ParsedRoute;
  cargo: ParsedCargo;
  order: ParsedOrder;
  company: string;
  rawData: string[];
}

export class ExcelParser {
  /**
   * Парсит строку с данными о грузе
   * @param cargoData - строка с данными о грузе
   * @returns ParsedCargo | null - объект с данными о грузе или null
   */
  static parseCargo(cargoData: string): ParsedCargo | null {
    const match = cargoData.match(/(\d+\.?\d*)\s*куб\.м\/(\d+)\s*кг\/(\d+\.?\d*)\s*м\/([^/]+)/);
    
    if (!match || !match[1] || !match[2] || !match[3] || !match[4]) return null;
    
    return {
      volume: parseFloat(match[1]),
      weight: parseInt(match[2]),
      length: parseFloat(match[3]),
      additionalInfo: match[4]
    };
  }

  /**
   * Парсит строку с данными о заказе и клиенте
   * @param orderData - строка с данными о заказе
   * @returns ParsedOrder | null - объект с данными о заказе или null
   */
  static parseOrder(orderData: string): ParsedOrder | null {
    // Нормализуем экранированные символы
    const normalizedData = orderData.replace(/\\\./g, '.');
    
    // Парсим номер заказа и время
    const orderMatch = normalizedData.match(/(\d+)\.Заказано\.(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
    if (!orderMatch || !orderMatch[1] || !orderMatch[2] || !orderMatch[3] || !orderMatch[4] || !orderMatch[5]) return null;
    
    // Парсим имя клиента
    const nameMatch = normalizedData.match(/Заказано\.\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\.([А-Яа-я\s]+?)\.{8,}/);
    if (!nameMatch || !nameMatch[1]) return null;
    
    // Парсим информацию о доставке
    const deliveryMatch = normalizedData.match(/\.{8,}(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})\.\.(\d+)/);
    if (!deliveryMatch || !deliveryMatch[1] || !deliveryMatch[2] || !deliveryMatch[3] || !deliveryMatch[4] || !deliveryMatch[5]) return null;
    
    return {
      orderNumber: orderMatch[1],
      orderDate: `${orderMatch[2]}.${orderMatch[3]}.${orderMatch[4]}`,
      orderTime: orderMatch[5],
      customerName: nameMatch[1].trim(),
      deliveryDate: `${deliveryMatch[1]}.${deliveryMatch[2]}.${deliveryMatch[3]}`,
      deliveryTime: deliveryMatch[4],
      deliveryId: deliveryMatch[5]
    };
  }

  /**
   * Парсит полную строку данных из Excel
   * @param rowData - массив строк из Excel
   * @returns ParsedRowData | null - объект с полными данными или null
   */
  static parseRow(rowData: string[]): ParsedRowData | null {
    if (!Array.isArray(rowData) || rowData.length < 4) {
      return null;
    }

    const [routeInfo, cargoData, orderData, companyInfo] = rowData;
    
    if (!routeInfo || !cargoData || !orderData || !companyInfo) {
      return null;
    }
    
    // Парсим груз
    const cargo = this.parseCargo(cargoData);
    if (!cargo) {
      console.warn('Не удалось распарсить данные о грузе:', cargoData);
      return null;
    }
    
    // Парсим заказ
    const order = this.parseOrder(orderData);
    if (!order) {
      console.warn('Не удалось распарсить данные о заказе:', orderData);
      return null;
    }
    
    // Парсим информацию о маршруте
    const route = this.parseRoute(routeInfo);
    
    return {
      route,
      cargo,
      order,
      company: companyInfo,
      rawData: rowData
    };
  }

  /**
   * Парсит информацию о маршруте
   * @param routeInfo - строка с информацией о маршруте
   * @returns ParsedRoute - объект с данными о маршруте
   */
  static parseRoute(routeInfo: string): ParsedRoute {
    // Формат: "01.09.25_77_00ч_ВИП_19"
    const parts = routeInfo.split('_');
    
    if (parts.length >= 4) {
      return {
        date: parts[0] || '',
        region: parts[1] || '',
        time: parts[2] || '',
        type: parts[3] || '',
        number: parts[4] || null
      };
    }
    
    return {
      date: routeInfo,
      region: '',
      time: '',
      type: '',
      number: null
    };
  }

  /**
   * Валидирует распарсенные данные
   * @param parsedData - распарсенные данные
   * @returns boolean - true если данные валидны
   */
  static validate(parsedData: ParsedRowData): boolean {
    if (!parsedData) return false;
    
    const required = ['cargo', 'order'];
    for (const field of required) {
      if (!parsedData[field as keyof ParsedRowData]) return false;
    }
    
    // Проверяем обязательные поля груза
    if (!parsedData.cargo.volume || !parsedData.cargo.weight) return false;
    
    // Проверяем обязательные поля заказа
    if (!parsedData.order.orderNumber || !parsedData.order.customerName) return false;
    
    return true;
  }

  /**
   * Форматирует распарсенные данные для вывода
   * @param parsedData - распарсенные данные
   * @returns string - отформатированная строка
   */
  static format(parsedData: ParsedRowData): string {
    if (!this.validate(parsedData)) {
      return '❌ Данные невалидны';
    }
    
    const { route, cargo, order } = parsedData;
    
    return `📦 **Заказ №${order.orderNumber}**
👤 **Клиент**: ${order.customerName}
📅 **Дата заказа**: ${order.orderDate} ${order.orderTime}
🚚 **Доставка**: ${order.deliveryDate} ${order.deliveryTime}
📏 **Груз**: ${cargo.volume} куб.м, ${cargo.weight} кг, ${cargo.length} м
📍 **Маршрут**: ${route.date} ${route.region} ${route.time}`;
  }
}

export default ExcelParser;
