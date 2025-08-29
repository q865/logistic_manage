const config = {
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
export default config;
//# sourceMappingURL=knexfile.js.map