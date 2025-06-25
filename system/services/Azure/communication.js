// Import required packages
const { EmailClient } = require("@azure/communication-email");

/**
 * Azure Communication Service for sending emails
 */
class AzureCommunicationService {
    constructor(connectionString) {
        this.emailClient = new EmailClient(connectionString);
    }

    /**
     * Send an email with optional attachments
     * @param {Object} options - Email options
     * @param {string} options.sender - Sender email address
     * @param {string|string[]} options.recipients - Recipient email address(es)
     * @param {string} options.subject - Email subject
     * @param {string} options.htmlContent - HTML content of the email
     * @param {string} options.plainTextContent - Plain text content of the email
     * @param {Object[]} [options.attachments] - Optional attachments
     * @returns {Promise<Object>} - Response from Azure Communication Services
     */
    async sendEmail({
        sender,
        recipients,
        subject,
        htmlContent,
        plainTextContent,
        attachments = [],
    }) {
        try {
            console.log("==>>", {
                sender,
                recipients,
                subject,
                htmlContent,
                plainTextContent,
            });
            // Prepare recipients array
            const recipientsList = Array.isArray(recipients)
                ? recipients.map((email) => ({ address: email }))
                : [{ address: recipients }];

            // Prepare message object
            const message = {
                senderAddress: sender,
                content: {
                    subject,
                    html: htmlContent,
                    plainText: plainTextContent,
                },
                recipients: {
                    to: recipientsList,
                },
            };

            // Add attachments if provided
            if (attachments && attachments.length > 0) {
                message.attachments = attachments.map((attachment) => ({
                    name: attachment.name,
                    contentType: attachment.contentType,
                    contentInBase64: attachment.content,
                }));
            }

            // Send email
            const poller = await this.emailClient.beginSend(message);
            const response = await poller.pollUntilDone();

            return {
                success: true,
                messageId: response.id,
                response,
            };
        } catch (error) {
            console.error("Error sending email:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// Export both services
module.exports = AzureCommunicationService;
