import pkg from 'knex';
type Knex = pkg.Knex;

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('trips', (table) => {
    table.increments('id').primary();
    table.integer('driver_id').unsigned().notNullable().references('id').inTable('drivers').onDelete('CASCADE');
    table.integer('delivery_id').unsigned().nullable().references('id').inTable('deliveries').onDelete('SET NULL');
    table.string('route_info').notNullable();
    table.enum('status', ['review', 'with_driver', 'rework', 'lost', 'verified']).notNullable().defaultTo('review');
    table.text('notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('trips');
}
