#!/usr/bin/env node

/**
 * Тест интеграции Excel импорта с созданием рейсов
 * Запуск: node test_excel_trips_integration.mjs
 */

import { ExcelProcessingService } from './dist/services/excelProcessingService.js';

async function testExcelTripsIntegration() {
  console.log('🧪 Тестирование интеграции Excel с рейсами...\n');

  try {
    const excelService = new ExcelProcessingService();
    
    // Создаем мок-буфер для тестирования
    const mockBuffer = Buffer.from('test excel data');
    
    console.log('📊 Обрабатываем Excel файл...');
    const results = await excelService.processExcelFile(mockBuffer);
    
    console.log('✅ Результаты обработки:');
    console.log(`   • Всего строк: ${results.totalRows}`);
    console.log(`   • Создано рейсов: ${results.tripsCreated}`);
    console.log(`   • Создано доставок: ${results.deliveriesCreated}`);
    console.log(`   • Ошибки рейсов: ${results.tripErrors?.length || 0}`);
    console.log(`   • Ошибки доставок: ${results.deliveryErrors?.length || 0}`);
    
    if (results.tripErrors && results.tripErrors.length > 0) {
      console.log('\n⚠️ Ошибки создания рейсов:');
      results.tripErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (results.deliveryErrors && results.deliveryErrors.length > 0) {
      console.log('\n⚠️ Ошибки создания доставок:');
      results.deliveryErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n📋 Детали по строкам:');
    results.results.slice(0, 3).forEach((result, index) => {
      console.log(`\n   Строка ${index + 1}:`);
      console.log(`   ${result.formatted}`);
    });
    
    if (results.results.length > 3) {
      console.log(`\n   ... и еще ${results.results.length - 3} строк`);
    }
    
    console.log('\n🎯 Тест завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    console.error('Детали:', error);
  }
}

// Запуск тестов
if (import.meta.url === `file://${process.argv[1]}`) {
  testExcelTripsIntegration();
}
