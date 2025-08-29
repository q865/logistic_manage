// src/database/knex.ts
import Knex from 'knex';
import { config } from '../knexfile.js';

// Создаем и экспортируем единственный экземпляр Knex
export const knexInstance = Knex(config.development!);
