import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('drivers', (table) => {
    table.increments('id').primary();

    // PersonalData
    table.string('lastName').notNullable();
    table.string('firstName').notNullable();
    table.string('patronymic');
    table.date('birthDate').notNullable();

    // Passport
    table.string('passport_series').notNullable();
    table.string('passport_number').notNullable();
    table.string('passport_issuedBy').notNullable();
    table.date('passport_issueDate').notNullable();
    table.string('passport_departmentCode').notNullable();
    table.string('passport_registrationAddress').notNullable();

    // Vehicle
    table.string('vehicle_make').notNullable();
    table.string('vehicle_model').notNullable();
    table.string('vehicle_licensePlate').notNullable().unique();
    table.string('vehicle_vin').notNullable().unique();
    table.integer('vehicle_year').notNullable();
    table.string('vehicle_type').notNullable();
    table.string('vehicle_chassis');
    table.string('vehicle_bodyColor').notNullable();
    table.string('vehicle_bodyNumber');
    table.string('vehicle_ptsNumber').notNullable();
    table.string('vehicle_stsNumber').notNullable();
    table.string('vehicle_stsIssueInfo').notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('drivers');
}

