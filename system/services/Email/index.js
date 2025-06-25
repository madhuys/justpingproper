const AzureCommunicationService = require("../Azure/communication");
const logger = require("../../utils/logger");
const path = require("path");
const fs = require("fs");
const config = require("../../config/config");

class EmailService {
  constructor() {
    this.communicationService = new AzureCommunicationService(
      process.env.AZURE_COMMUNICATION_CONNECTION_STRING
    );
    this.templateDir = path.join(__dirname, "../../emailsTemplates");
  }

  /**
   * Get HTML template content
   * @param {string} templateName - Name of the template file without extension
   * @param {Object} variables - Variables to replace in the template
   * @returns {string} Processed HTML content
   */
  getTemplateContent(templateName, variables = {}) {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      let content = fs.readFileSync(templatePath, "utf8");

      // Replace variables in the template
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        content = content.replace(regex, variables[key]);
      });

      return content;
    } catch (error) {
      logger.error(`Error loading email template ${templateName}:`, error);
      throw new Error(`Failed to load email template: ${error.message}`);
    }
  }

  /**
   * Send email using Azure Communication Services
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.templateName - Template name to use
   * @param {Object} options.variables - Variables for the template
   * @param {string} [options.plainText] - Plain text version of the email
   * @returns {Promise<Object>} Email send result
   */
  async sendEmail(options) {
    try {
      const { to, subject, templateName, variables, plainText } = options;

      const htmlContent = this.getTemplateContent(templateName, variables);

      const emailResult = await this.communicationService.sendEmail({
        sender: process.env.DOMAIN_EMAIL || config.email.defaultSender,
        recipients: to,
        subject: subject,
        htmlContent: htmlContent,
        plainTextContent: plainText || this.stripHtml(htmlContent),
      });

      logger.info(`Email sent successfully to ${to}`);
      return {
        success: true,
        messageId: emailResult.messageId,
      };
    } catch (error) {
      logger.error("Error sending email:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convert HTML to plain text
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  stripHtml(html) {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, "")
      .replace(/<script[^>]*>.*<\/script>/gm, "")
      .replace(/<[^>]+>/gm, "")
      .replace(/([\r\n]+ +)+/gm, "\n")
      .trim();
  }
}

module.exports = new EmailService();
