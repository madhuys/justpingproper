const axios = require("axios");

// Base URL for all API calls
const getMetaBaseUrl = () =>
    process.env.META_API_URL || "https://graph.facebook.com/v15.0";

// Create request headers with authentication
function getMetaHeaders(accessToken) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
    };
}

// Make API request with clean error handling
async function makeMetaRequest(
    method,
    endpoint,
    accessToken,
    data = null,
    queryParams = null,
) {
    try {
        let url = `${getMetaBaseUrl()}${endpoint}`;

        // Add query parameters if provided
        if (queryParams) {
            const queryString = new URLSearchParams(queryParams).toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        const config = {
            method,
            url,
            headers: getMetaHeaders(accessToken),
        };

        if (data) {
            config.data =
                typeof data === "string" ? data : JSON.stringify(data);
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        // Add Meta-specific error properties
        if (error.response) {
            error.statusCode = error.response.status;
            error.errorMessage =
                error.response.data?.error?.message || error.message;
            error.isMetaError = true;
        }
        throw error;
    }
}

// Create a new template on Meta
async function createTemplate(payload, accessToken, wabaId) {
    try {
        const response = await makeMetaRequest(
            "post",
            `/${wabaId}/message_templates`,
            accessToken,
            payload,
        );
        return { data: response };
    } catch (error) {
        if (error.response?.data?.error?.message) {
            return {
                error: error.response.data.error.message,
                statusCode: error.response.status,
            };
        }
        return {
            error: "Failed to create template on Meta",
            statusCode: error.statusCode || 500,
            originalError: error.message,
        };
    }
}

// Get template by ID from Meta
async function getTemplateById(accessToken, wabaId, templateId) {
    try {
        const response = await makeMetaRequest(
            "get",
            `/${wabaId}/message_templates/${templateId}`,
            accessToken,
        );
        return response;
    } catch (error) {
        throw error;
    }
}

// Get all templates from Meta
async function getTemplates(accessToken, wabaId, queryParams = {}) {
    try {
        const response = await makeMetaRequest(
            "get",
            `/${wabaId}/message_templates`,
            accessToken,
            null,
            queryParams,
        );
        return response;
    } catch (error) {
        throw error;
    }
}

// Delete template from Meta
async function deleteTemplate(accessToken, wabaId, templateId) {
    try {
        const response = await makeMetaRequest(
            "delete",
            `/${wabaId}/message_templates/${templateId}`,
            accessToken,
        );
        return { data: response };
    } catch (error) {
        if (error.response?.data?.error?.message) {
            return {
                error: error.response.data.error.message,
                statusCode: error.response.status,
            };
        }
        return {
            error: "Failed to delete template from Meta",
            statusCode: error.statusCode || 500,
            originalError: error.message,
        };
    }
}

module.exports = {
    createTemplate,
    getTemplateById,
    getTemplates,
    deleteTemplate,
};
