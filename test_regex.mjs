const testData = "13908.Заказано.01\\.09\\.2025 00:00:00.Кулушов Марат Шайлообаевич........01\\.09\\.2025 01:30:00..202";

console.log('Тестовые данные:', testData);

const regex = /(\d+)\.Заказано\.(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})\.([А-Яа-я\s]+?)\.{8,}(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})\.\.(\d+)/;

const match = testData.match(regex);
console.log('Match result:', match);

if (match) {
  console.log('\nРазобранные части:');
  console.log('1. Номер заказа:', match[1]);
  console.log('2. Дата заказа:', match[2]);
  console.log('3. Время заказа:', match[3]);
  console.log('4. Имя клиента:', match[4]);
  console.log('5. Дата доставки:', match[5]);
  console.log('6. Время доставки:', match[6]);
  console.log('7. ID доставки:', match[7]);
} else {
  console.log('Регулярное выражение не сработало');
  
  // Попробуем упрощенное выражение
  console.log('\nПробуем упрощенное выражение...');
  const simpleRegex = /(\d+)\.Заказано\.(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})/;
  const simpleMatch = testData.match(simpleRegex);
  console.log('Simple match:', simpleMatch);
}
