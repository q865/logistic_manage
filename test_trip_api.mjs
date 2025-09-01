#!/usr/bin/env node

/**
 * Тест API эндпоинтов для рейсов
 * Запуск: node test_trip_api.mjs
 */

const API_BASE = 'http://localhost:3000/api/trips';

// Тестовые данные
const testTrip = {
  driver_id: 1,
  route_info: '01.09.25_77_00ч_ВИП_19 - Тестовый маршрут',
  status: 'review',
  notes: 'Тестовый рейс для проверки API'
};

async function testTripAPI() {
  console.log('🚀 Тестирование API рейсов...\n');

  try {
    // 1. Создание рейса
    console.log('1️⃣ Создание рейса...');
    const createResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTrip)
    });
    
    const createResult = await createResponse.json();
    console.log('✅ Создание:', createResult.success ? 'УСПЕХ' : 'ОШИБКА');
    
    if (!createResult.success) {
      console.log('❌ Ошибка:', createResult.error);
      return;
    }
    
    const tripId = createResult.data.id;
    console.log(`📝 Создан рейс с ID: ${tripId}\n`);

    // 2. Получение рейса по ID
    console.log('2️⃣ Получение рейса по ID...');
    const getResponse = await fetch(`${API_BASE}/${tripId}`);
    const getResult = await getResponse.json();
    console.log('✅ Получение:', getResult.success ? 'УСПЕХ' : 'ОШИБКА');
    if (getResult.success) {
      console.log('📋 Данные рейса:', JSON.stringify(getResult.data, null, 2));
    }
    console.log('');

    // 3. Смена статуса
    console.log('3️⃣ Смена статуса рейса...');
    const statusResponse = await fetch(`${API_BASE}/${tripId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'with_driver' })
    });
    
    const statusResult = await statusResponse.json();
    console.log('✅ Смена статуса:', statusResult.success ? 'УСПЕХ' : 'ОШИБКА');
    if (statusResult.success) {
      console.log('🔄 Новый статус:', statusResult.data.status);
    }
    console.log('');

    // 4. Получение рейсов водителя
    console.log('4️⃣ Получение рейсов водителя...');
    const driverResponse = await fetch(`${API_BASE}/driver/1`);
    const driverResult = await driverResponse.json();
    console.log('✅ Рейсы водителя:', driverResult.success ? 'УСПЕХ' : 'ОШИБКА');
    if (driverResult.success) {
      console.log(`🚗 Найдено рейсов: ${driverResult.count}`);
    }
    console.log('');

    // 5. Получение всех рейсов
    console.log('5️⃣ Получение всех рейсов...');
    const allResponse = await fetch(API_BASE);
    const allResult = await allResponse.json();
    console.log('✅ Все рейсы:', allResult.success ? 'УСПЕХ' : 'ОШИБКА');
    if (allResult.success) {
      console.log(`📊 Всего рейсов: ${allResult.pagination.total}`);
      console.log(`📄 Страница: ${allResult.pagination.page}/${allResult.pagination.totalPages}`);
    }
    console.log('');

    // 6. Обновление рейса
    console.log('6️⃣ Обновление рейса...');
    const updateResponse = await fetch(`${API_BASE}/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        notes: 'Обновленные заметки к рейсу',
        status: 'verified'
      })
    });
    
    const updateResult = await updateResponse.json();
    console.log('✅ Обновление:', updateResult.success ? 'УСПЕХ' : 'ОШИБКА');
    if (updateResult.success) {
      console.log('📝 Обновленные данные:', JSON.stringify(updateResult.data, null, 2));
    }
    console.log('');

    // 7. Удаление рейса
    console.log('7️⃣ Удаление рейса...');
    const deleteResponse = await fetch(`${API_BASE}/${tripId}`, {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    console.log('✅ Удаление:', deleteResult.success ? 'УСПЕХ' : 'ОШИБКА');
    console.log('');

    console.log('🎉 Тестирование API завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запуск тестов
if (import.meta.url === `file://${process.argv[1]}`) {
  testTripAPI();
}
