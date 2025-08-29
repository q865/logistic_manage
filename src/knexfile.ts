// src/knexfile.ts
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем абсолютный путь к текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Определяем базовую конфигурацию
const baseConfig = {
  client: 'sqlite3',
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, './database/migrations')
  },
  seeds: {
    directory: path.join(__dirname, './database/seeds')
  }
};

// Конфигурация для разных окружений
export const development = {
  ...baseConfig,
  connection: {
    filename: path.join(__dirname, '../drivers.db')
  }
};

export const test = {
  ...baseConfig,
  connection: {
    filename: ':memory:' // Используем базу данных в памяти для тестов
  }
};

// Экспортируем конфиг по умолчанию (для разработки)
export default development;