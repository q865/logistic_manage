// src/database/knex.ts
import knex from 'knex';
import * as knexConfig from '../knexfile.js';

// Определяем, какую конфигурацию использовать, на основе переменной окружения
const environment = process.env.NODE_ENV || 'development';
const config = environment === 'test' ? knexConfig.test : knexConfig.development;

console.log(`[Knex] Initializing connection for [${environment}] environment.`);

export const knexInstance = knex(config);
export default knexInstance;