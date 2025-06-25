const {
    BlobServiceClient,
    StorageSharedKeyCredential,
} = require("@azure/storage-blob");

/**
 * Azure Blob Storage Service for file operations
 */
class AzureBlobStorageService {
    /**
     * Initialize the Blob Storage Service
     * @param {Object} config - Configuration
     * @param {string} config.accountName - Storage account name
     * @param {string} config.accountKey - Storage account key
     * @param {string} [config.connectionString] - Or use connection string instead
     */
    constructor(config) {
        if (config.connectionString) {
            this.blobServiceClient = BlobServiceClient.fromConnectionString(
                config.connectionString,
            );
        } else {
            const sharedKeyCredential = new StorageSharedKeyCredential(
                config.accountName,
                config.accountKey,
            );

            const blobUrl = `https://${config.accountName}.blob.core.windows.net`;
            this.blobServiceClient = new BlobServiceClient(
                blobUrl,
                sharedKeyCredential,
            );
        }
    }

    /**
     * Upload a file to a container
     * @param {Object} options - Upload options
     * @param {string} options.containerName - Container name
     * @param {string} options.blobName - Blob name (file path in the container)
     * @param {Buffer|Uint8Array|string|Blob|ArrayBuffer} options.content - File content
     * @param {Object} [options.metadata] - Optional metadata
     * @param {string} [options.contentType] - Content type of the file
     * @returns {Promise<Object>} - Upload result
     */
    async uploadFile({
        containerName,
        blobName,
        content,
        metadata = {},
        contentType = undefined,
    }) {
        try {
            // Get container client
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);

            // Create container if it doesn't exist
            await containerClient.createIfNotExists({ access: "private" });

            // Get blob client
            const blockBlobClient =
                containerClient.getBlockBlobClient(blobName);

            // Set upload options
            const options = {
                metadata,
                blobHTTPHeaders: contentType
                    ? {
                          blobContentType: contentType,
                      }
                    : undefined,
            };

            // Upload content
            const uploadResponse = await blockBlobClient.upload(
                content,
                content.length,
                options,
            );

            return {
                success: true,
                url: blockBlobClient.url,
                etag: uploadResponse.etag,
                response: uploadResponse,
            };
        } catch (error) {
            console.error("Error uploading file:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Download a file from a container
     * @param {Object} options - Download options
     * @param {string} options.containerName - Container name
     * @param {string} options.blobName - Blob name (file path in the container)
     * @returns {Promise<Object>} - Download result containing the file buffer
     */
    async downloadFile({ containerName, blobName }) {
        try {
            // Get container client
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);

            // Get blob client
            const blockBlobClient =
                containerClient.getBlockBlobClient(blobName);

            // Check if blob exists
            const exists = await blockBlobClient.exists();
            if (!exists) {
                return {
                    success: false,
                    error: "File not found",
                };
            }

            // Download content
            const downloadResponse = await blockBlobClient.download(0);

            // Convert stream to buffer
            const chunks = [];
            const readableStream = downloadResponse.readableStreamBody;

            return new Promise((resolve, reject) => {
                readableStream.on("data", (data) => {
                    chunks.push(
                        data instanceof Buffer ? data : Buffer.from(data),
                    );
                });

                readableStream.on("end", () => {
                    const content = Buffer.concat(chunks);
                    resolve({
                        success: true,
                        content,
                        contentType: downloadResponse.contentType,
                        metadata: downloadResponse.metadata,
                        properties: downloadResponse.properties,
                    });
                });

                readableStream.on("error", (error) => {
                    reject({
                        success: false,
                        error: error.message,
                    });
                });
            });
        } catch (error) {
            console.error("Error downloading file:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * List all blobs in a container
     * @param {string} containerName - Container name
     * @param {Object} [options] - List options
     * @param {string} [options.prefix] - Optional prefix to filter blobs
     * @returns {Promise<Object>} - List of blobs
     */
    async listFiles(containerName, options = {}) {
        try {
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blobs = [];

            // List blobs
            const listOptions = {};
            if (options.prefix) {
                listOptions.prefix = options.prefix;
            }

            const iterator = containerClient.listBlobsFlat(listOptions);
            let blobItem = await iterator.next();

            while (!blobItem.done) {
                blobs.push({
                    name: blobItem.value.name,
                    contentType: blobItem.value.properties.contentType,
                    contentLength: blobItem.value.properties.contentLength,
                    lastModified: blobItem.value.properties.lastModified,
                    metadata: blobItem.value.metadata,
                });

                blobItem = await iterator.next();
            }

            return {
                success: true,
                blobs,
            };
        } catch (error) {
            console.error("Error listing files:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Delete a file from a container
     * @param {Object} options - Delete options
     * @param {string} options.containerName - Container name
     * @param {string} options.blobName - Blob name (file path in the container)
     * @returns {Promise<Object>} - Delete result
     */
    async deleteFile({ containerName, blobName }) {
        try {
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blockBlobClient =
                containerClient.getBlockBlobClient(blobName);

            // Delete blob
            const deleteResponse = await blockBlobClient.delete();

            return {
                success: true,
                response: deleteResponse,
            };
        } catch (error) {
            console.error("Error deleting file:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Generate a Shared Access Signature (SAS) URL for a blob
     * @param {Object} options - SAS options
     * @param {string} options.containerName - Container name
     * @param {string} options.blobName - Blob name (file path in the container)
     * @param {Date} options.expiresOn - Expiration date
     * @param {Object} [options.permissions] - Optional permissions
     * @returns {Promise<Object>} - SAS URL information
     */
    async generateSasUrl({
        containerName,
        blobName,
        expiresOn,
        permissions = {
            read: true,
            write: false,
            delete: false,
            create: false,
            add: false,
            tag: false,
        },
    }) {
        try {
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blockBlobClient =
                containerClient.getBlockBlobClient(blobName);

            // Generate SAS token
            const sasOptions = {
                expiresOn,
                permissions,
            };

            const sasToken = await blockBlobClient.generateSasUrl(sasOptions);

            return {
                success: true,
                sasUrl: sasToken,
            };
        } catch (error) {
            console.error("Error generating SAS URL:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

module.exports = AzureBlobStorageService;
