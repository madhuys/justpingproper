const fs = require("fs");
const axios = require("axios");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

// Define project download directory
const DOWNLOAD_DIR = path.join(__dirname, "../../uploads/downloads");

/**
 * Downloads a file from a URL and saves it to the project's download directory
 * @param {string} url - The URL of the file to download
 * @returns {Promise<{filePath: string, contentType: string}>} Path to downloaded file and content type
 */
async function downloadFile(url) {
    // Validate URL
    if (!url || typeof url !== "string") {
        throw new Error("Invalid URL provided");
    }

    try {
        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
            timeout: 30000, // 30 seconds timeout
            validateStatus: (status) => status >= 200 && status < 300,
        });

        const contentType =
            response.headers["content-type"] || "application/octet-stream";
        const extension = getExtensionFromContentType(contentType);

        // Ensure download directory exists
        if (!fs.existsSync(DOWNLOAD_DIR)) {
            fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
        }

        // Create a unique filename in the project's download directory
        const fileName = `${uuidv4()}${extension}`;
        const filePath = path.join(DOWNLOAD_DIR, fileName);

        // Save the file
        const writer = fs.createWriteStream(filePath);

        // Pipe the response data to the file stream
        response.data.pipe(writer);

        // Handle errors on the response data
        response.data.on("error", (err) => {
            writer.close();
            fs.unlinkSync(filePath); // Clean up partial file
            throw new Error(`Error in download stream: ${err.message}`);
        });

        return new Promise((resolve, reject) => {
            writer.on("finish", () => {
                // Verify file was actually written
                if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                    resolve({ filePath, contentType });
                } else {
                    reject(
                        new Error(
                            "File download failed: Empty or missing file",
                        ),
                    );
                }
            });
            writer.on("error", (err) => {
                // Clean up any partially written file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(err);
            });
        });
    } catch (error) {
        console.error("Error downloading file:", error.message);
        // Include more detailed error information if available
        const errorMessage = error.response
            ? `Failed with status ${error.response.status}: ${error.message}`
            : `Failed to download file from URL: ${error.message}`;
        throw new Error(errorMessage);
    }
}

/**
 * Get file extension based on content type
 * @param {string} contentType - Content-Type header value
 * @returns {string} File extension with dot
 */
function getExtensionFromContentType(contentType) {
    const mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "application/pdf": ".pdf",
        "document/pdf": ".pdf",
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            ".docx",
    };
    if (contentType && contentType.toLowerCase().includes("pdf")) {
        return ".pdf";
    }

    return mapping[contentType] || ".bin";
}

function deleteFileByPath(filePath) {
    // eslint-disable-next-line no-console
    fs.unlinkSync(filePath);
    // eslint-disable-next-line no-useless-return
    return;
}

module.exports = {
    deleteFileByPath,
    downloadFile,
};
