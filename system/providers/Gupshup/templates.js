const axios = require("axios");

// Helper function to get media URI
function getMediaUri(appId, mediaId) {
    return `${process.env.GUPSHUP_ENDPOINT}/${appId}/wa/media/${mediaId}?download=false`;
}

// Extract custom parameters from container meta
function extractCustomParams(containerMeta) {
    const result = {
        customParams: [],
    };

    const addParam = (paramName, paramValue, type) => {
        result.customParams.push({
            paramName,
            paramValue,
            type,
        });
    };

    let values = [];

    function extractValues(sampleText) {
        const regex = /\[(.*?)\]/g;
        let match;
        while ((match = regex.exec(sampleText))) {
            values.push(match[1]);
        }
    }

    const findParams = (text, sampleText, type) => {
        values = [];
        const regex = /\{\{(\d+)\}\}/g;
        let match;
        while ((match = regex.exec(text))) {
            const paramName = match[1];
            extractValues(sampleText);
            addParam(paramName, values[parseInt(paramName) - 1], type);
        }
    };

    if (containerMeta.header) {
        findParams(containerMeta.header, containerMeta.sampleHeader, "header");
    }

    if (containerMeta.data) {
        findParams(containerMeta.data, containerMeta.sampleText, "body");
    }

    return result.customParams;
}

// Map Gupshup template to standard format
function mapGupshupTemplate(template) {
    let buttons = null;
    if (template.containerMeta.buttons) {
        buttons = template.containerMeta.buttons.map((button) => ({
            type: button.type.toLowerCase(),
            text: button.text,
            url: button.url || "",
        }));
    }

    let headerData = {
        type: "text",
        content: template.containerMeta.header,
        mediaId: null,
        mediaLink: null,
    };

    if (template.containerMeta.mediaId) {
        headerData = {
            type: "media",
            content: null,
            mediaId: template.containerMeta.mediaId,
            mediaLink: template.containerMeta.mediaUrl,
        };
    }

    const customParams = extractCustomParams(template.containerMeta);

    return {
        wabaId: template.wabaId,
        templateId: template.id,
        elementName: template.elementName,
        provider: "gupshup",
        category: template.category,
        subCategory: "",
        status: template.status,
        language: {
            code: template.languageCode,
            text: template.languageCode,
        },
        type: template.templateType.toLowerCase(),
        header: headerData,
        body: template.containerMeta.data,
        footer: template.containerMeta.footer,
        buttons: buttons,
        customParams: customParams,
        additionalInfo: {
            expiresIn: 0,
            securityRecommendation:
                template.containerMeta.addSecurityRecommendation,
            isUrlBtnClickTrackingEnabled: false,
            limitedTimeOffer: false,
        },
        createdAt: new Date(template.createdOn),
        lastModified: new Date(template.modifiedOn),
    };
}

// Make API request with clean error handling
async function makeGupshupRequest(
    method,
    endpoint,
    apiKey,
    data = null,
    contentType = "application/json",
) {
    try {
        const url = `${GUPSHUP_ENDPOINT}${endpoint}`;

        const headers = {
            accept: "application/json",
            "Content-Type": contentType,
        };

        // Add apiKey to headers based on the content type
        if (contentType === "application/json") {
            headers.apikey = apiKey;
        } else {
            headers.Authentication = apiKey;
        }

        const config = {
            method,
            url,
            headers,
        };

        if (data) {
            if (contentType === "application/x-www-form-urlencoded") {
                if (typeof data === "string") {
                    config.data = data;
                } else {
                    config.data = new URLSearchParams(data).toString();
                }
            } else {
                config.data =
                    typeof data === "string" ? data : JSON.stringify(data);
            }
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        // Add Gupshup-specific error properties
        if (error.response) {
            error.statusCode = error.response.status;
            error.errorMessage = error.response.data?.message || error.message;
            error.isGupshupError = true;
        }
        throw error;
    }
}

// Get all templates from Gupshup
async function getGupshupTemplates(apiKey, appId) {
    try {
        if (!appId) {
            const error = new Error("Provider Details not found");
            error.isGupshupError = true;
            error.statusCode = 400;
            throw error;
        }

        console.log(`${GUPSHUP_ENDPOINT}/app/${appId}/template`, "url");

        const response = await axios.get(
            `${GUPSHUP_ENDPOINT}/app/${appId}/template`,
            {
                headers: {
                    "Content-Type": "application/json",
                    apikey: apiKey,
                },
            },
        );

        if (response.status === 200) {
            const templates = response?.data?.templates;
            for (const template of templates) {
                const containerMetaObj = JSON.parse(template.containerMeta);
                if (containerMetaObj.mediaId) {
                    containerMetaObj.mediaUrl = getMediaUri(
                        appId,
                        containerMetaObj.mediaId,
                    );
                }
                template.containerMeta = containerMetaObj;
                template.meta = JSON.parse(template.meta);
            }

            return {
                templates: response?.data?.templates?.map((x) =>
                    mapGupshupTemplate(x),
                ),
                totalTemplates: response?.data?.templates?.length,
            };
        }

        return { templates: [], totalTemplates: 0 };
    } catch (error) {
        // Add useful properties to the error
        if (error.response) {
            error.statusCode = error.response.status;
            error.errorMessage =
                error.response.data?.message || "Error fetching template data";
            error.isGupshupError = true;
        }
        throw error;
    }
}

// Create a new template on Gupshup
async function createGupshupTemplate(payload, appId, apiKey) {
    try {
        const data =
            typeof payload === "string" ? payload : JSON.stringify(payload);

        const response = await makeGupshupRequest(
            "post",
            `/app/${appId}/template`,
            apiKey,
            data,
            "application/x-www-form-urlencoded",
        );

        return response;
    } catch (error) {
        if (error.response?.data?.errorMessage) {
            return {
                error: error.response.data.errorMessage,
                statusCode: error.response.status,
            };
        }
        return {
            error: "Failed to create template on Gupshup",
            statusCode: error.statusCode || 500,
            originalError: error.message,
        };
    }
}

// Get template by ID from Gupshup
async function getGupshupTemplateById(apiKey, appId, templateId) {
    try {
        // Note: This is a placeholder as the original code doesn't include this function
        // You may need to adjust the endpoint based on Gupshup's API
        const response = await makeGupshupRequest(
            "get",
            `/app/${appId}/template/${templateId}`,
            apiKey,
        );
        return response;
    } catch (error) {
        // Pass through the error to parent
        throw error;
    }
}

module.exports = {
    getGupshupTemplates,
    createGupshupTemplate,
    getGupshupTemplateById,
};
