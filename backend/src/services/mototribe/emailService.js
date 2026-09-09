const sgMail = require("@sendgrid/mail");

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey && apiKey !== "SG.your_sendgrid_api_key_here") {
  sgMail.setApiKey(apiKey);
}

/**
 * Sends an email using SendGrid API
 * Returns { success: boolean, messageId?: string, error?: string } without throwing
 * @param {string} toEmail
 * @param {string} subject
 * @param {string} htmlBody
 * @returns {Promise<Object>}
 */
const sendEmail = async (toEmail, subject, htmlBody) => {
  try {
    if (!toEmail) {
      return { success: false, error: "No recipient email provided" };
    }

    const currentApiKey = process.env.SENDGRID_API_KEY;
    if (!currentApiKey || currentApiKey === "SG.your_sendgrid_api_key_here") {
      console.warn(
        "[EmailService] SendGrid API key not configured or set to placeholder. Mocking email send."
      );
      return { success: true, messageId: "mock-sendgrid-id-12345" };
    }

    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@kaindra.com",
      subject,
      html: htmlBody,
    };

    const [response] = await sgMail.send(msg);
    return {
      success: true,
      messageId: response?.headers?.["x-message-id"] || "sg-success",
    };
  } catch (error) {
    console.error("Email Service error:", error.message || error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
};

module.exports = {
  sendEmail,
};
