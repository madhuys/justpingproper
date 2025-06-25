// api/Templates/controller.js
const boom = require("@hapi/boom");
const service = require("./service");
const logger = require("../../system/utils/logger");
const {
    extractPaginationParams,
    extractFilters,
} = require("../../system/utils/pagination");

/**
 * Create a new template
 * @param {Object} data - Template data
 * @param {String} businessId - Business ID
 * @param {String} userId - User ID creating the template
 * @returns {Object} API response with created template data
 */
module.exports.createTemplate = async (data, businessId, userId) => {
    try {
        console.log(`Creating template for business ${businessId}`, { data });
        const template = await service.createTemplate(data, businessId, userId);
        return {
            success: true,
            data: template,
            statusCode: 201,
            message: "Template created successfully",
        };
    } catch (error) {
        logger.error("Error in createTemplate controller:", error);
        if (error.isBoom) {
            throw error;
        }
        if (error.code === "23505") {
            throw boom.conflict(
                "Template with this name already exists for this business and language",
            );
        }
        throw boom.badImplementation("Failed to create template");
    }
};

/**
 * Get templates with filters and pagination
 * @param {String} businessId - Business ID
 * @param {Object} query - Query parameters
 * @returns {Object} API response with templates and pagination data
 */
module.exports.getTemplates = async (businessId, query) => {
    try {
        // Extract pagination params using the utility
        const pagination = extractPaginationParams(query);
        // Extract filters, removing pagination params and adding business_id
        const filters = extractFilters(query, { business_id: businessId });

        // Extract refresh_status flag and convert it to boolean properly
        const refreshStatus =
            query.refresh_status === "true" ||
            query.refresh_status === true ||
            query.refresh_status === 1 ||
            query.refresh_status === "1";

        logger.debug(`Getting templates with filters:`, {
            filters,
            pagination,
            refreshStatus,
            businessId,
        });

        const result = await service.getTemplates(
            filters,
            pagination,
            refreshStatus,
        );
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    } catch (error) {
        logger.error("Error in getTemplates controller:", error);
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch templates");
    }
};

/**
 * Get a template by ID
 * @param {String} templateId - Template ID
 * @returns {Object} API response with template data
 */
module.exports.getTemplateById = async (templateId) => {
    try {
        const template = await service.getTemplateById(templateId);
        return {
            success: true,
            data: template,
        };
    } catch (error) {
        logger.error(
            `Error in getTemplateById controller for ${templateId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to fetch template");
    }
};

/**
 * Check template status with provider
 * @param {String} templateId - Template ID
 * @returns {Object} API response with template status
 */
module.exports.checkTemplateStatus = async (businessId, templateId) => {
    try {
        logger.debug(`Checking template status for ID: ${templateId}`);
        const status = await service.checkTemplateStatus(
            businessId,
            templateId,
        );
        console.log("Status:", status);
        return {
            success: true,
            data: status,
        };
    } catch (error) {
        logger.error(
            `Error in checkTemplateStatus controller for ${templateId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to check template status");
    }
};

/**
 * Update a template
 * @param {String} templateId - Template ID
 * @param {Object} data - Updated template data
 * @param {String} userId - User ID making the update
 * @returns {Object} API response with updated template data
 */
module.exports.updateTemplate = async (templateId, data, userId) => {
    try {
        logger.debug(`Updating template ${templateId}`, { data });
        const template = await service.updateTemplate(templateId, data, userId);
        return {
            success: true,
            data: template,
            message: "Template updated successfully",
        };
    } catch (error) {
        logger.error(
            `Error in updateTemplate controller for ${templateId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to update template");
    }
};

/**
 * Delete a template
 * @param {String} templateId - Template ID
 * @param {String} businessId - Business ID
 * @returns {Object} API response with deletion confirmation
 */
module.exports.deleteTemplate = async (templateId, businessId) => {
    try {
        logger.debug(
            `Deleting template ${templateId} for business ${businessId}`,
        );
        const result = await service.deleteTemplate(templateId, businessId);
        return {
            success: true,
            data: result,
            message: "Template deleted successfully",
        };
    } catch (error) {
        logger.error(
            `Error in deleteTemplate controller for ${templateId}:`,
            error,
        );
        if (error.isBoom) {
            throw error;
        }
        throw boom.badImplementation("Failed to delete template");
    }
};
