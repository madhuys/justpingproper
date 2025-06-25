// Simple logger utility with different log levels
const logger = {
    info: (message, ...args) => {
        console.log(`[INFO] ${message}`, ...args);
    },

    warn: (message, ...args) => {
        console.log(`[WARN] ${message}`, ...args);
    },

    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
    },

    debug: (message, ...args) => {
        if (process.env.DEBUG) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    },
};

module.exports = logger;
