// Тестируем новый модуль ExcelParser
import ExcelParser from './src/parsers/excelParser.js';

// Тестовые данные
const testRow = [
  "01.09.25_77_00ч_ВИП_19",
  "3.32 куб.м/871 кг/1.010 м/Нет",
  "13908.Заказано.01\\.09\\.2025 00:00:00.Кулушов Марат Шайлообаевич........01\\.09\\.2025 01:30:00..202",
  'ООО "ГРУЗ СЕРВИС"'
];

console.log('🧪 Тестируем модуль ExcelParser\n');

// Тестируем парсинг груза
console.log('=== Тест парсинга груза ===');
const cargo = ExcelParser.parseCargo(testRow[1]);
console.log('Результат:', cargo);

// Тестируем парсинг заказа
console.log('\n=== Тест парсинга заказа ===');
const order = ExcelParser.parseOrder(testRow[2]);
console.log('Результат:', order);

// Тестируем парсинг маршрута
console.log('\n=== Тест парсинга маршрута ===');
const route = ExcelParser.parseRoute(testRow[0]);
console.log('Результат:', route);

// Тестируем полный парсинг строки
console.log('\n=== Тест полного парсинга ===');
const fullData = ExcelParser.parseRow(testRow);
console.log('Результат:', fullData);

// Тестируем валидацию
console.log('\n=== Тест валидации ===');
const isValid = ExcelParser.validate(fullData);
console.log('Данные валидны:', isValid);

// Тестируем форматирование
console.log('\n=== Тест форматирования ===');
const formatted = ExcelParser.format(fullData);
console.log('Отформатированный результат:');
console.log(formatted);

// Тестируем с невалидными данными
console.log('\n=== Тест с невалидными данными ===');
const invalidData = ExcelParser.parseRow(['invalid', 'data']);
console.log('Невалидные данные:', invalidData);
console.log('Валидация:', ExcelParser.validate(invalidData));
console.log('Форматирование:', ExcelParser.format(invalidData));
