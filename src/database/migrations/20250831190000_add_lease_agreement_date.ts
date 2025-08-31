import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Добавляем поле date для договора аренды
  await knex.schema.alterTable('drivers', (table) => {
    table.date('lease_agreement_date').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Убираем поле date для договора аренды
  await knex.schema.alterTable('drivers', (table) => {
    table.dropColumn('lease_agreement_date');
  });
}
