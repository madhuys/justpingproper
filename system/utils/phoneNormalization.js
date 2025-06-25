/**
 * Phone Number Normalization Utility
 *
 * This utility provides consistent phone number normalization across the system
 * to fix broadcast conversation lookup and user matching issues.
 */

const logger = require("./logger");

// Default country code for India
const DEFAULT_COUNTRY_CODE = "91";
const INDIA_MOBILE_PREFIXES = ["6", "7", "8", "9"]; // Indian mobile numbers start with these digits

/**
 * Normalize phone number to consistent format for database storage and lookup
 *
 * @param {string} phone - Phone number in any format
 * @param {string} countryCode - Country code (optional, defaults to 91 for India)
 * @returns {Object} - Normalized phone data with multiple formats
 */
function normalizePhoneNumber(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  if (!phone) {
    return {
      isValid: false,
      error: "Phone number is required",
    };
  }

  try {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, "");

    if (!digitsOnly) {
      return {
        isValid: false,
        error: "Phone number must contain digits",
      };
    }

    // Clean country code (remove + if present)
    const cleanCountryCode = countryCode.replace(/\D/g, "");

    let normalizedPhone;
    let detectedCountryCode = cleanCountryCode;

    // Handle different input formats
    if (digitsOnly.length === 10) {
      // Indian mobile number without country code (e.g., 8140888275)
      // Validate it's a valid Indian mobile number
      if (INDIA_MOBILE_PREFIXES.includes(digitsOnly[0])) {
        normalizedPhone = digitsOnly;
        detectedCountryCode = DEFAULT_COUNTRY_CODE;
      } else {
        return {
          isValid: false,
          error: "Invalid Indian mobile number format",
        };
      }
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      // Indian number with country code (e.g., 918140888275)
      normalizedPhone = digitsOnly.substring(2); // Remove country code
      detectedCountryCode = "91";

      // Validate the mobile number part
      if (!INDIA_MOBILE_PREFIXES.includes(normalizedPhone[0])) {
        return {
          isValid: false,
          error: "Invalid Indian mobile number format",
        };
      }
    } else if (digitsOnly.length === 13 && digitsOnly.startsWith("91")) {
      // Handle cases where there might be extra digits
      return {
        isValid: false,
        error: "Invalid phone number length",
      };
    } else if (digitsOnly.length > 10 && digitsOnly.length <= 15) {
      // International number - extract country code and number
      // For now, assume first 1-3 digits are country code
      if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
        normalizedPhone = digitsOnly.substring(2);
        detectedCountryCode = "91";
      } else {
        // For other international numbers, use provided country code
        const maxCountryCodeLength = Math.min(3, digitsOnly.length - 8);
        for (let i = 1; i <= maxCountryCodeLength; i++) {
          const possibleCountryCode = digitsOnly.substring(0, i);
          const remainingDigits = digitsOnly.substring(i);

          if (remainingDigits.length >= 8 && remainingDigits.length <= 12) {
            normalizedPhone = remainingDigits;
            detectedCountryCode = possibleCountryCode;
            break;
          }
        }

        if (!normalizedPhone) {
          return {
            isValid: false,
            error: "Unable to parse international phone number",
          };
        }
      }
    } else {
      return {
        isValid: false,
        error: "Invalid phone number length",
      };
    }

    // Validate the normalized phone number
    if (normalizedPhone.length < 8 || normalizedPhone.length > 12) {
      return {
        isValid: false,
        error: "Invalid phone number length after normalization",
      };
    }

    // Generate all possible formats for matching
    const formats = generatePhoneFormats(normalizedPhone, detectedCountryCode);

    return {
      isValid: true,
      normalized: normalizedPhone, // 8140888275
      countryCode: detectedCountryCode, // 91
      e164: `+${detectedCountryCode}${normalizedPhone}`, // +918140888275
      withCountryCode: `${detectedCountryCode}${normalizedPhone}`, // 918140888275
      formats, // All possible matching formats
    };
  } catch (error) {
    logger.error("Error normalizing phone number:", error);
    return {
      isValid: false,
      error: "Failed to normalize phone number",
    };
  }
}

/**
 * Generate all possible phone number formats for matching
 *
 * @param {string} phone - Normalized phone number (digits only, no country code)
 * @param {string} countryCode - Country code
 * @returns {Array} - Array of possible phone number formats
 */
function generatePhoneFormats(phone, countryCode) {
  const formats = [
    phone, // 8140888275
    `+${phone}`, // +8140888275 (unlikely but possible)
    `${countryCode}${phone}`, // 918140888275
    `+${countryCode}${phone}`, // +918140888275
  ];

  // Add common variations
  if (countryCode === "91") {
    // For Indian numbers, also include variations without leading +
    formats.push(`91${phone}`); // 918140888275 (duplicate but safe)
  }

  // Remove duplicates and return
  return [...new Set(formats)];
}

/**
 * Find the best matching phone number from a list of possible formats
 *
 * @param {string} searchPhone - Phone number to search for
 * @param {Array} phoneList - List of phone numbers to search in
 * @returns {string|null} - Best matching phone number or null
 */
function findMatchingPhone(searchPhone, phoneList) {
  if (!searchPhone || !phoneList || phoneList.length === 0) {
    return null;
  }

  const normalized = normalizePhoneNumber(searchPhone);
  if (!normalized.isValid) {
    return null;
  }

  // Try exact matches first
  for (const format of normalized.formats) {
    if (phoneList.includes(format)) {
      return format;
    }
  }

  // Try fuzzy matching (normalize each phone in the list and compare)
  for (const listPhone of phoneList) {
    const listNormalized = normalizePhoneNumber(listPhone);
    if (
      listNormalized.isValid &&
      listNormalized.normalized === normalized.normalized
    ) {
      return listPhone;
    }
  }

  return null;
}

/**
 * Create phone number variations for database queries
 *
 * @param {string} phone - Input phone number
 * @returns {Array} - Array of phone number variations for OR queries
 */
function createPhoneQueryVariations(phone) {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized.isValid) {
    return [phone]; // Return original if normalization fails
  }

  return normalized.formats;
}

/**
 * Validate phone number format
 *
 * @param {string} phone - Phone number to validate
 * @param {string} expectedFormat - Expected format ('e164', 'normalized', 'withCountryCode')
 * @returns {boolean} - True if valid
 */
function validatePhoneFormat(phone, expectedFormat = "e164") {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized.isValid) {
    return false;
  }

  switch (expectedFormat) {
    case "e164":
      return phone === normalized.e164;
    case "normalized":
      return phone === normalized.normalized;
    case "withCountryCode":
      return phone === normalized.withCountryCode;
    default:
      return true; // Any valid format is acceptable
  }
}

/**
 * Format phone number for display
 *
 * @param {string} phone - Phone number
 * @param {string} format - Display format ('international', 'national', 'compact')
 * @returns {string} - Formatted phone number
 */
function formatPhoneForDisplay(phone, format = "international") {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized.isValid) {
    return phone; // Return original if normalization fails
  }

  switch (format) {
    case "international":
      return `+${normalized.countryCode} ${normalized.normalized}`;
    case "national":
      return normalized.normalized;
    case "compact":
      return normalized.withCountryCode;
    case "e164":
      return normalized.e164;
    default:
      return normalized.e164;
  }
}

module.exports = {
  normalizePhoneNumber,
  generatePhoneFormats,
  findMatchingPhone,
  createPhoneQueryVariations,
  validatePhoneFormat,
  formatPhoneForDisplay,
  DEFAULT_COUNTRY_CODE,
  INDIA_MOBILE_PREFIXES,
};
