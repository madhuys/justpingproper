/**
 * Application Configuration
 *
 * Central configuration settings for the application
 */

// Get environment
const environment = process.env.NODE_ENV || "development";
// Base configuration
const config = {
  environment,
  port: process.env.PORT || 8083,

  // Database settings
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
      // Add auth specific limits
      auth: {
        windowMs: 60 * 1000, // 1 minute
        max: 5, // 5 attempts per minute
      },
    },
    timeout: parseInt(process.env.API_TIMEOUT || "30000", 10), // 30 seconds
    security: {
      bcryptSaltRounds: 12,
      tokenRotation: true,
      passwordMinLength: 8,
      cors: {
        allowedOrigins: (process.env.ALLOWED_ORIGINS || "").split(","),
        allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      },
    },
  },

  // Migration settings
  migrations: {
    // Whether to auto-run migrations on app startup
    autoRun: process.env.AUTO_RUN_MIGRATIONS === "true" || false,
    // Only allow migration auto-run in specific environments
    autoRunEnvironments: ["development", "dev", "local", "test"],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: environment === "production" ? "json" : "dev",
  },

  email: {
    defaultSender: "DoNotReply@justping.ai",
  },
};

// Environment-specific overrides
if (environment === "test") {
  config.database.connectionString =
    process.env.TEST_DATABASE_URL || config.database.connectionString;
}

if (environment === "production") {
  // Force SSL in production
  config.database.enableSsl = true;

  // Disable migration auto-run in production by default
  config.migrations.autoRun =
    process.env.AUTO_RUN_MIGRATIONS === "true" ? true : false;
}

module.exports = config;
