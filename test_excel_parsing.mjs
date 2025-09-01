import XLSX from 'xlsx';

// Читаем Excel файл
const workbook = XLSX.readFile('templates/Груз сервис(12).xlsx');
console.log('Sheet names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Конвертируем в JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log('Raw data:', JSON.stringify(jsonData, null, 2));

// Пробуем парсить первую строку
if (jsonData.length > 0) {
  const firstRow = jsonData[0];
  console.log('First row:', firstRow);
  
  // Объединяем все ячейки в одну строку
  const rawData = firstRow.join(' ');
  console.log('Combined raw data:', rawData);
  
  // Пробуем найти паттерны
  const identifierMatch = rawData.match(/^(\d{2}\.\d{2}\.\d{2}_\d+_[^_]+_[^_]+_\d+)/);
  console.log('Identifier match:', identifierMatch);
  
  const cargoMatch = rawData.match(/(\d+\.?\d*)\s*куб\.м\/(\d+)\s*кг\/(\d+\.?\d*)\s*м\/([^/]+)/);
  console.log('Cargo match:', cargoMatch);
  
  const orderMatch = rawData.match(/(\d+)\.Заказано\.(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})/);
  console.log('Order match:', orderMatch);
}
