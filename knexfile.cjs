// knexfile.cjs
const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'drivers.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations')
    }
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations')
    }
  }
};
