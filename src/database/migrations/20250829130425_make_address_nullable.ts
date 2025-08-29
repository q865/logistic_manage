import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('drivers', (table) => {
    // .nullable() делает поле необязательным
    table.string('passport_registrationAddress').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('drivers', (table) => {
    // Возвращаем обратно обязательное ограничение
    table.string('passport_registrationAddress').notNullable().alter();
  });
}

