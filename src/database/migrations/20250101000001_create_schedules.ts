// src/database/migrations/20250101000001_create_schedules.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('schedules', (table) => {
    table.increments('id').primary();
    table.integer('driver_id').unsigned().notNullable();
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.enum('status', ['working', 'off', 'repair', 'reserve', 'vacation', 'loading']).notNullable();
    table.string('route_info', 500); // Информация о маршруте
    table.string('notes', 1000); // Дополнительные заметки
    table.integer('created_by').unsigned(); // Кто создал запись
    table.timestamps(true, true);

    // Индексы для быстрого поиска
    table.index(['driver_id', 'date']);
    table.index(['date', 'status']);
    table.index(['driver_id', 'date', 'start_time']);

    // Внешние ключи
    table.foreign('driver_id').references('id').inTable('drivers').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('drivers').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('schedules');
}
