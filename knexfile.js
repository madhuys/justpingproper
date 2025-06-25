// knexfile.js
require("dotenv").config({ path: `./${process.env.NODE_ENV || "local"}.env` });
const { getDbConfig } = require("./system/config/database");

module.exports = {
  client: "pg",
  connection: getDbConfig(),
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations/knex",
  },
};
