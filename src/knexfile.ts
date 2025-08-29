import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./drivers.db"
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations'
    }
  },
};

export { config };
