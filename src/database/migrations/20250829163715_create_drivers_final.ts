import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('drivers', (table) => {
    table.increments('id').primary();
    table.json('personalData').notNullable();
    table.json('passport').notNullable();
    table.json('vehicle').notNullable();
    table.json('driverLicense').nullable();
    table.json('leaseAgreement').nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('drivers');
}