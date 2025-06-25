/**
 * Pagination utility for standardizing pagination across the application
 */
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
const DEFAULT_SORT_BY = "created_at";
const DEFAULT_SORT_ORDER = "desc";
const MAX_PER_PAGE = 100;

/**
 * Extract and normalize pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {Object} options - Optional configuration overrides
 * @returns {Object} Normalized pagination parameters
 */
function extractPaginationParams(query, options = {}) {
    // Set defaults with optional overrides
    const defaults = {
        page: options.defaultPage || DEFAULT_PAGE,
        per_page: options.defaultPerPage || DEFAULT_PER_PAGE,
        sort_by: options.defaultSortBy || DEFAULT_SORT_BY,
        sort_order: options.defaultSortOrder || DEFAULT_SORT_ORDER,
        maxPerPage: options.maxPerPage || MAX_PER_PAGE,
    };

    // Parse and validate page (minimum 1)
    const page = Math.max(1, parseInt(query.page || defaults.page));

    // Parse and validate per_page (with maximum limit)
    let perPage = parseInt(query.per_page || defaults.per_page);
    perPage = Math.min(perPage, defaults.maxPerPage);

    // Get sort parameters with defaults
    const sortBy = query.sort_by || defaults.sort_by;
    const sortOrder = query.sort_order || defaults.sort_order;

    return {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
    };
}

/**
 * Extract filters from query, removing pagination parameters
 * @param {Object} query - Request query object
 * @param {Object} additionalFilters - Additional filters to include
 * @returns {Object} Filters object
 */
function extractFilters(query, additionalFilters = {}) {
    const filters = { ...query, ...additionalFilters };

    // Remove pagination parameters
    delete filters.page;
    delete filters.per_page;
    delete filters.sort_by;
    delete filters.sort_order;

    return filters;
}

module.exports = {
    extractPaginationParams,
    extractFilters,
    DEFAULT_PAGE,
    DEFAULT_PER_PAGE,
    DEFAULT_SORT_BY,
    DEFAULT_SORT_ORDER,
};
