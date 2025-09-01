import { ExcelParserService } from './dist/services/excelParserService.js';

// Тестовые данные на основе реального Excel файла
const testRow = [
  "01.09.25_77_00ч_ВИП_19",
  "3.32 куб.м/871 кг/1.010 м/Нет",
  "13908.Заказано.01.09.2025 00:00:00.Кулушов Марат Шайлообаевич........01.09.2025 01:30:00..202",
  'ООО "ГРУЗ СЕРВИС"'
];

console.log('Тестовая строка:', testRow);

try {
  // Используем приватный метод через рефлексию
  const result = ExcelParserService.parseDeliveryExcel(Buffer.from('test'));
  console.log('Результат парсинга:', result);
} catch (error) {
  console.log('Ошибка:', error.message);
}

// Тестируем регулярные выражения отдельно
const cargoData = testRow[1];
const orderAndCustomerData = testRow[2];

console.log('\nТест парсинга груза:');
const cargoMatch = cargoData.match(/(\d+\.?\d*)\s*куб\.м\/(\d+)\s*кг\/(\d+\.?\d*)\s*м\/([^/]+)/);
console.log('Cargo match:', cargoMatch);

console.log('\nТест парсинга заказа:');
const orderMatch = orderAndCustomerData.match(/(\d+)\.Заказано\.(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})/);
console.log('Order match:', orderMatch);

console.log('\nТест парсинга имени клиента:');
const nameMatch = orderAndCustomerData.match(/Заказано\.\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\.([А-Яа-я\s]+?)\.{8,}/);
console.log('Name match:', nameMatch);

console.log('\nТест парсинга доставки:');
const deliveryMatch = orderAndCustomerData.match(/\.{8,}(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})\.\.(\d+)/);
console.log('Delivery match:', deliveryMatch);
