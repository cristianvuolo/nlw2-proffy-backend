import Knex from 'knex';

export async function up(Knex: Knex) {
    return Knex.schema.createTable('class_schedules', table => {
        table.increments('id').primary();

        table.integer('week_day').notNullable();
        table.integer('from').notNullable();
        table.integer('to').notNullable();


        table.integer('class_id')
            .notNullable()
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    })
}

export async function down(Knex: Knex) {
    Knex.schema.dropSchema('class_schedules');
}
