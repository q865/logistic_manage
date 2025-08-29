// src/database/knex.ts
import type { Knex as KnexType } from 'knex';
import Knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

// Определяем __dirname для ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация Knex теперь находится прямо здесь
const knexConfig: KnexType.Config = {
  client: "sqlite3",
  connection: {
    // Используем абсолютный путь, чтобы избежать проблем с CWD
    filename: path.resolve(__dirname, "../../../drivers.db")
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, './migrations')
  }
};

// Создаем и экспортируем единственный экземпляр Knex
export const knexInstance = Knex(knexConfig);
