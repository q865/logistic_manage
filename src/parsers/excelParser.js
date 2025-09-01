/**
 * Парсер для данных из Excel файлов
 * Обрабатывает строки с информацией о грузах, заказах и доставке
 */

export class ExcelParser {
  /**
   * Парсит строку с данными о грузе
   * @param {string} cargoData - строка с данными о грузе
   * @returns {Object|null} - объект с данными о грузе или null
   */
  static parseCargo(cargoData) {
    const match = cargoData.match(/(\d+\.?\d*)\s*куб\.м\/(\d+)\s*кг\/(\d+\.?\d*)\s*м\/([^/]+)/);
    
    if (!match) return null;
    
    return {
      volume: parseFloat(match[1]),
      weight: parseInt(match[2]),
      length: parseFloat(match[3]),
      additionalInfo: match[4]
    };
  }

  /**
   * Парсит строку с данными о заказе и клиенте
   * @param {string} orderData - строка с данными о заказе
   * @returns {Object|null} - объект с данными о заказе или null
   */
  static parseOrder(orderData) {
    // Нормализуем экранированные символы
    const normalizedData = orderData.replace(/\\\./g, '.');
    
    // Парсим номер заказа и время
    const orderMatch = normalizedData.match(/(\d+)\.Заказано\.(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
    if (!orderMatch) return null;
    
    // Парсим имя клиента
    const nameMatch = normalizedData.match(/Заказано\.\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\.([А-Яа-я\s]+?)\.{8,}/);
    if (!nameMatch) return null;
    
    // Парсим информацию о доставке
    const deliveryMatch = normalizedData.match(/\.{8,}(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})\.\.(\d+)/);
    if (!deliveryMatch) return null;
    
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
   * @param {Array} rowData - массив строк из Excel
   * @returns {Object|null} - объект с полными данными или null
   */
  static parseRow(rowData) {
    if (!Array.isArray(rowData) || rowData.length < 4) {
      return null;
    }

    const [routeInfo, cargoData, orderData, companyInfo] = rowData;
    
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
   * @param {string} routeInfo - строка с информацией о маршруте
   * @returns {Object} - объект с данными о маршруте
   */
  static parseRoute(routeInfo) {
    // Формат: "01.09.25_77_00ч_ВИП_19"
    const parts = routeInfo.split('_');
    
    if (parts.length >= 4) {
      return {
        date: parts[0],
        region: parts[1],
        time: parts[2],
        type: parts[3],
        number: parts[4] || null
      };
    }
    
    return {
      raw: routeInfo
    };
  }

  /**
   * Валидирует распарсенные данные
   * @param {Object} parsedData - распарсенные данные
   * @returns {boolean} - true если данные валидны
   */
  static validate(parsedData) {
    if (!parsedData) return false;
    
    const required = ['cargo', 'order'];
    for (const field of required) {
      if (!parsedData[field]) return false;
    }
    
    // Проверяем обязательные поля груза
    if (!parsedData.cargo.volume || !parsedData.cargo.weight) return false;
    
    // Проверяем обязательные поля заказа
    if (!parsedData.order.orderNumber || !parsedData.order.customerName) return false;
    
    return true;
  }

  /**
   * Форматирует распарсенные данные для вывода
   * @param {Object} parsedData - распарсенные данные
   * @returns {string} - отформатированная строка
   */
  static format(parsedData) {
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

// Экспортируем по умолчанию для совместимости
export default ExcelParser;
