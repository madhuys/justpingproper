const getDbConfig = () => {
  const isAzure =
    process.env.DB_HOST && process.env.DB_HOST.includes("azure.com");

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Use proper SSL configuration for Azure
    ssl: isAzure ? { rejectUnauthorized: false } : false,
  };
};

module.exports = {
  getDbConfig,
};
