// Тестируем парсинг с реальными данными из Excel файла
const testRow = [
  "01.09.25_77_00ч_ВИП_19",
  "3.32 куб.м/871 кг/1.010 м/Нет",
  "13908.Заказано.01\\.09\\.2025 00:00:00.Кулушов Марат Шайлообаевич........01\\.09\\.2025 01:30:00..202",
  'ООО "ГРУЗ СЕРВИС"'
];

console.log('Тестовая строка:', testRow);

// Тестируем парсинг груза
const cargoData = testRow[1];
const cargoMatch = cargoData.match(/(\d+\.?\d*)\s*куб\.м\/(\d+)\s*кг\/(\d+\.?\d*)\s*м\/([^/]+)/);
console.log('\nПарсинг груза:', cargoMatch);

// Тестируем парсинг заказа
const orderAndCustomerData = testRow[2];
console.log('\nДанные заказа и клиента:', orderAndCustomerData);

// Анализируем структуру данных
console.log('\n=== АНАЛИЗ СТРУКТУРЫ ДАННЫХ ===');
console.log('Длина строки:', orderAndCustomerData.length);
console.log('Символы по позициям:');
for (let i = 0; i < Math.min(orderAndCustomerData.length, 100); i++) {
  const char = orderAndCustomerData[i];
  if (char === '\\' || char === '.' || char === ' ' || char === ':') {
    console.log(`Позиция ${i}: '${char}' (код: ${char.charCodeAt(0)})`);
  }
}

// Создаем функцию для парсинга с учетом экранированных символов
function parseOrderData(data) {
  // Заменяем экранированные точки на обычные для упрощения парсинга
  const normalizedData = data.replace(/\\\./g, '.');
  console.log('\nНормализованные данные:', normalizedData);
  
  // Парсим номер заказа и время
  const orderMatch = normalizedData.match(/(\d+)\.Заказано\.(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
  console.log('Парсинг заказа:', orderMatch);
  
  // Парсим имя клиента
  const nameMatch = normalizedData.match(/Заказано\.\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\.([А-Яа-я\s]+?)\.{8,}/);
  console.log('Парсинг имени:', nameMatch);
  
  // Парсим информацию о доставке
  const deliveryMatch = normalizedData.match(/\.{8,}(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})\.\.(\d+)/);
  console.log('Парсинг доставки:', deliveryMatch);
  
  return { orderMatch, nameMatch, deliveryMatch };
}

// Парсим данные
const parseResult = parseOrderData(orderAndCustomerData);

// Проверяем, что все части найдены
if (cargoMatch && parseResult.orderMatch && parseResult.nameMatch && parseResult.deliveryMatch) {
  console.log('\n✅ Все части успешно распарсены!');
  console.log('Груз:', {
    volume: cargoMatch[1],
    weight: cargoMatch[2],
    length: cargoMatch[3],
    additionalInfo: cargoMatch[4]
  });
  console.log('Заказ:', {
    number: parseResult.orderMatch[1],
    date: `${parseResult.orderMatch[2]}.${parseResult.orderMatch[3]}.${parseResult.orderMatch[4]}`,
    time: parseResult.orderMatch[5]
  });
  console.log('Клиент:', parseResult.nameMatch[1]);
  console.log('Доставка:', {
    date: `${parseResult.deliveryMatch[1]}.${parseResult.deliveryMatch[2]}.${parseResult.deliveryMatch[3]}`,
    time: parseResult.deliveryMatch[4],
    id: parseResult.deliveryMatch[5]
  });
} else {
  console.log('\n❌ Не все части распарсены');
  console.log('cargoMatch:', !!cargoMatch);
  console.log('orderMatch:', !!parseResult.orderMatch);
  console.log('nameMatch:', !!parseResult.nameMatch);
  console.log('deliveryMatch:', !!parseResult.deliveryMatch);
}
