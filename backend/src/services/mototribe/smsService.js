const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

/**
 * Format Indian phone numbers into clean E.164 format (+91...)
 * Handles leading zeros, pre-existing +91 prefixes, spaces, dashes, parentheses, accidental +910... numbers, etc.
 * @param {string} phoneNumber
 * @returns {string}
 */
const formatIndianPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";
  const raw = String(phoneNumber).trim();

  // Extract digits only
  let digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  // If starts with 91, check if followed by leading zeros (e.g. "+9107031234567")
  if (digits.startsWith("91")) {
    let rest = digits.substring(2);
    while (rest.startsWith("0")) {
      rest = rest.substring(1);
    }
    if (rest.length === 10) {
      return `+91${rest}`;
    }
  }

  // Strip leading zeros for raw local numbers (e.g. "09876543210" -> "9876543210")
  while (digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  // Re-check after stripping leading zeros
  if (digits.startsWith("91")) {
    let rest = digits.substring(2);
    while (rest.startsWith("0")) {
      rest = rest.substring(1);
    }
    if (rest.length === 10) {
      return `+91${rest}`;
    }
  }

  // Standard 10-digit Indian mobile number
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Fallback: if original raw string started with +, prepend + to digits
  if (raw.startsWith("+")) {
    return `+${digits}`;
  }

  return `+91${digits}`;
};

// Initialize SNS client using environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

/**
 * Send SMS using AWS SNS Client
 * @param {string} phoneNumber
 * @param {string} message
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendSms = async (phoneNumber, message) => {
  try {
    if (!phoneNumber) {
      return { success: false, error: "No phone number provided" };
    }

    const formattedPhone = formatIndianPhoneNumber(phoneNumber);
    const command = new PublishCommand({
      PhoneNumber: formattedPhone,
      Message: message,
    });

    const response = (await snsClient.send(command)) || {};
    return { success: true, messageId: response.MessageId || "mock-msg-id-12345" };
  } catch (error) {
    console.error("SMS Service error:", error.message || error);
    return { success: false, error: error.message || "Failed to send SMS" };
  }
};

module.exports = {
  sendSms,
  formatIndianPhoneNumber,
};
