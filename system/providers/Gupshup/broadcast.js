const axios = require("axios");

// Base URL for all API calls
const getBaseUrl = () =>
    process.env.KARIX_URL || "https://rcmapi.instaalerts.zone/services/rcm";

// Create request headers with authentication
function getHeaders(apiKey) {
    return {
        "Content-Type": "application/json",
        Authentication: `Bearer ${apiKey}`,
    };
}

// Make API request with clean error handling
async function makeRequest(
    method,
    endpoint,
    apiKey,
    data = null,
    params = null,
) {
    try {
        const url = `${getBaseUrl()}${endpoint}`;
        const config = {
            method,
            url,
            headers: getHeaders(apiKey),
        };

        if (params) {
            config.params = params;
        }

        if (data) {
            config.data =
                typeof data === "string" ? data : JSON.stringify(data);
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        // Add useful properties to the error
        if (error.response) {
            error.statusCode = error.response.status;
            error.errorMessage =
                error.response.data?.errorMessage || error.message;
            error.isKarixError = true;
        }
        throw error;
    }
}

// Send a message
async function sendMessage(apiKey, { from, to, content, reference = {} }) {
    const webhookDnId = process.env.KARIX_WEBHOOK_DN_ID || "1001";
    try {
        let recipientObj = {};

        if (Array.isArray(to)) {
            recipientObj = {
                recipients: to.map((recipientTo) => ({
                    to: recipientTo,
                    recipient_type: "individual",
                    reference,
                })),
            };
        } else {
            recipientObj = {
                recipient: {
                    to,
                    recipient_type: "individual",
                    reference,
                },
            };
        }

        const data = {
            message: {
                channel: "WABA",
                content,
                ...recipientObj,
                sender: {
                    from,
                },
                preferences: {
                    webHookDNId: webhookDnId,
                },
            },
            metaData: {
                version: "v1.0.9",
            },
        };

        const response = await makeRequest(
            "post",
            "/sendMessage",
            apiKey,
            data,
        );

        return {
            status: response?.batchStatus,
            data: response,
        };
    } catch (error) {
        // Pass through the error to parent
        throw error;
    }
}

// Send bulk messages
async function sendBulkMessage(apiKey, { from, messages }) {
    const webhookDnId = process.env.KARIX_WEBHOOK_DN_ID || "1001";
    try {
        const data = {
            channel: "WABA",
            sender: {
                from,
            },
            metaData: {
                version: "v1.0.9",
            },
            preferences: {
                webHookDNId: webhookDnId,
            },
            messages,
        };

        const response = await makeRequest(
            "post",
            "/sendBulkMessage",
            apiKey,
            data,
        );

        return {
            status: response?.batchStatus,
            data: response,
        };
    } catch (error) {
        // Pass through the error to parent
        throw error;
    }
}

module.exports = {
    sendMessage,
    sendBulkMessage,
};
