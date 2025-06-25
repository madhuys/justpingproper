const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const { downloadFile } = require("../../utils/file");

// Base URL for all API calls
const getBaseUrl = () =>
    process.env.KARIX_URL || "https://rcsgui.karix.solutions/api/v1.0";

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
        // Just pass the original error up to be handled by parent
        if (error.response) {
            error.statusCode = error.response.status;
            error.errorMessage =
                error.response.data?.errorMessage || error.message;
            error.isKarixError = true;
        }
        throw error;
    }
}

// Get templates - can get all or filter by name
async function getTemplates(apiKey, wabaId, params = {}) {
    try {
        const response = await makeRequest(
            "get",
            `/template/${wabaId}`,
            apiKey,
            null,
            params,
        );

        // Return all templates
        return {
            templates: response?.response?.templates || [],
            totalTemplates: response?.response?.templates?.length || 0,
            pageNumber: 0,
            pageSize: 0,
        };
    } catch (error) {
        // Pass through the error to parent
        throw error;
    }
}

// Get template by ID
async function getTemplateById(apiKey, wabaId, templateId) {
    try {
        const response = await makeRequest(
            "get",
            `/template/${wabaId}/${templateId}`,
            apiKey,
        );
        console.log("Response:", response?.response);
        return response?.response;
    } catch (error) {
        // Pass through the error to parent
        throw error;
    }
}

// Create a new template
async function createTemplate(apiKey, wabaId, templateData) {
    try {
        console.log(
            `Submitting template to Karix API: ${JSON.stringify(
                templateData,
                null,
                2,
            )}`,
        );
        const response = await makeRequest(
            "post",
            `/template/${wabaId}`,
            apiKey,
            templateData,
        );
        return response;
    } catch (error) {
        // Enhanced error logging with more details
        console.error(`Karix API Error: ${error.message}`, {
            statusCode: error.statusCode || error.response?.status,
            requestData: JSON.stringify(templateData),
            errorResponse: error.response?.data,
            errorDetails: error.isKarixError
                ? error.errorMessage
                : error.message,
            stack: error.stack,
        });

        // Special handling for axios network errors
        if (
            error.code === "ECONNREFUSED" ||
            error.code === "ETIMEDOUT" ||
            error.code === "ENOTFOUND"
        ) {
            return {
                error: `Network error: ${error.message}`,
                statusCode: 503,
                code: error.code,
                originalError: error.message,
                requestData: templateData,
            };
        }

        // Provide more detailed error response
        if (error.response?.data) {
            return {
                error: JSON.stringify(error.response.data),
                statusCode: error.response.status,
                details: error.response.data,
                requestData: templateData,
            };
        }
        return {
            error: error.isKarixError
                ? error.errorMessage
                : "Failed to create template",
            statusCode: error.statusCode || 500,
            originalError: error.message,
            requestData: templateData,
        };
    }
}

// Delete a template by ID
async function deleteTemplate(apiKey, wabaId, templateId) {
    try {
        const response = await makeRequest(
            "delete",
            `/template/${wabaId}/${templateId}`,
            apiKey,
        );

        return {
            success: true,
            data: response,
            message: "Template deleted successfully",
        };
    } catch (error) {
        // Pass through the error to parent
        throw error;
    }
}

// Upload media for template use
async function uploadMedia(apiKey, wabaId, filePath, fileType) {
    try {
        const form = new FormData();
        form.append("certifile", fs.createReadStream(filePath));
        form.append("file_type", fileType);

        const apiUrl = `${getBaseUrl()}/template/${wabaId}/media`;

        const response = await axios.post(apiUrl, form, {
            headers: {
                ...form.getHeaders(),
                Authentication: `Bearer ${apiKey}`,
            },
        });

        console.log("Upload Response:", response?.data?.response?.fileHandle);
        return response.data.url || response?.data?.response?.fileHandle; // Adjust as per actual API response
    } catch (error) {
        console.error(
            "Error uploading media:",
            error.response?.data || error.message,
        );

        // Consistent error handling with other functions
        if (error.response) {
            error.statusCode = error.response.status;
            error.errorMessage =
                error.response.data?.errorMessage || error.message;
            error.isKarixError = true;
        }
        throw error;
    }
}

/**
 * Upload media from a URL to Karix
 * @param {string} mediaUrl - URL of the media file
 * @param {string} wabaId - WhatsApp Business Account ID
 * @param {string} apiKey - API key for authentication
 * @returns {Promise<string>} URL of the uploaded media on Karix
 */
async function uploadMediaFromUrl(mediaUrl, wabaId, apiKey) {
    try {
        console.log(
            `Starting upload process for media: ${(mediaUrl, wabaId, apiKey)}`,
        );

        // Download file from URL
        const { filePath, contentType } = await downloadFile(mediaUrl);

        // Determine file type for Karix
        // const fileType = getKarixFileType(contentType);
        console.log(`File type determined: ${contentType}`);
        try {
            // Upload to Karix
            const result = await uploadMedia(
                apiKey,
                wabaId,
                filePath,
                contentType,
            );

            // Clean up temporary file
            try {
                fs.unlinkSync(filePath);
                console.log(`Temporary file deleted: ${filePath}`);
            } catch (cleanupError) {
                console.warn(
                    `Warning: Failed to delete temporary file: ${cleanupError.message}`,
                );
            }

            return result;
        } catch (uploadError) {
            // Clean up on error too
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                // Just log, we're already handling another error
                console.warn(
                    `Warning: Failed to delete temporary file: ${cleanupError.message}`,
                );
            }
            throw uploadError;
        }
    } catch (error) {
        console.error("Error uploading media from URL:", error);
        throw new Error(`Failed to upload media: ${error.message}`);
    }
}

/**
 * Converts file extension to Karix file type/extension format
 * @param {string} filename - Filename or path with extension
 * @returns {string} Karix file type and extension (e.g. "image/png")
 */
function getKarixFileType(filename) {
    // Extract extension from filename
    const extension = filename.split(".").pop().toLowerCase();

    // Image extensions
    if (
        ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff"].includes(
            extension,
        )
    ) {
        return `image/${extension}`;
    }

    // Video extensions
    if (
        ["mp4", "mov", "avi", "wmv", "flv", "webm", "mkv", "3gp"].includes(
            extension,
        )
    ) {
        return `video/${extension}`;
    }

    // Document extensions
    if (
        [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "txt",
            "csv",
            "rtf",
        ].includes(extension)
    ) {
        return `document/${extension}`;
    }

    // Default to document for unknown extensions
    return `document/${extension || "unknown"}`;
}

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    deleteTemplate,
    uploadMedia,
    uploadMediaFromUrl,
};
