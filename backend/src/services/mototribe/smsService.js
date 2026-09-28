/**
 * MSG91 SMS Service — Flow API v5 (per-template routing)
 *
 * Replaces the previous AWS SNS integration. Each SMS type (OTP, SOS)
 * maps to a separate DLT-approved MSG91 Flow template.
 *
 * Environment variables:
 *   MSG91_AUTH_KEY          – your MSG91 authkey
 *   MSG91_OTP_TEMPLATE_ID  – Flow template for OTP messages
 *   MSG91_SOS_TEMPLATE_ID  – Flow template for SOS emergency alerts
 */

const MSG91_API_URL = "https://control.msg91.com/api/v5/flow/";

// Maps templateType → { envVar, buildRecipient }
const TEMPLATE_CONFIG = {
  otp: {
    envVar: "MSG91_OTP_TEMPLATE_ID",
    buildRecipient: (mobiles, variables) => ({
      mobiles,
      OTP: variables.otpCode,
    }),
  },
  sos: {
    envVar: "MSG91_SOS_TEMPLATE_ID",
    buildRecipient: (mobiles, variables) => ({
      mobiles,
      RIDER: variables.riderName,
      RIDE: variables.rideTitle,
      LOCATION: variables.locationUrl,
    }),
  },
};

/**
 * Format Indian phone numbers into MSG91's expected format (91XXXXXXXXXX, no + prefix).
 * Handles leading zeros, pre-existing +91 prefixes, spaces, dashes, parentheses, etc.
 * @param {string} phoneNumber
 * @returns {string}
 */
const formatIndianPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";
  const raw = String(phoneNumber).trim();
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // If starts with 91, check if followed by leading zeros (e.g. "+9107031234567")
  if (digits.startsWith("91")) {
    let rest = digits.substring(2);
    while (rest.startsWith("0")) rest = rest.substring(1);
    if (rest.length === 10) return `91${rest}`;
  }

  // Strip leading zeros for raw local numbers (e.g. "09876543210" -> "9876543210")
  while (digits.startsWith("0")) digits = digits.substring(1);

  // Re-check after stripping leading zeros
  if (digits.startsWith("91")) {
    let rest = digits.substring(2);
    while (rest.startsWith("0")) rest = rest.substring(1);
    if (rest.length === 10) return `91${rest}`;
  }

  // Standard 10-digit Indian mobile number
  if (digits.length === 10) return `91${digits}`;

  // Fallback
  if (digits.startsWith("91")) return digits;
  return `91${digits}`;
};

/**
 * Send SMS using MSG91 Flow API v5.
 *
 * @param {string} phoneNumber   – recipient phone number (any Indian format)
 * @param {string} templateType  – "otp" or "sos"
 * @param {Object} variables     – template-specific values:
 *   For "otp":  { otpCode: string }
 *   For "sos":  { riderName: string, rideTitle: string, locationUrl: string }
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendSms = async (phoneNumber, templateType, variables = {}) => {
  try {
    if (!phoneNumber) {
      return { success: false, error: "No phone number provided" };
    }

    const config = TEMPLATE_CONFIG[templateType];
    if (!config) {
      return { success: false, error: `Unknown template type: ${templateType}` };
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env[config.envVar];

    if (!authKey || !templateId) {
      console.error(`SMS Service: MSG91_AUTH_KEY or ${config.envVar} not configured`);
      return { success: false, error: "SMS provider not configured" };
    }

    const formattedPhone = formatIndianPhoneNumber(phoneNumber);
    const recipient = config.buildRecipient(formattedPhone, variables);

    const body = {
      template_id: templateId,
      recipients: [recipient],
    };

    const response = await fetch(MSG91_API_URL, {
      method: "POST",
      headers: {
        authkey: authKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.type === "success") {
      return { success: true, messageId: data.message || "msg91-success" };
    }

    return { success: false, error: data.message || "MSG91 API returned an error" };
  } catch (error) {
    console.error("SMS Service error:", error.message || error);
    return { success: false, error: error.message || "Failed to send SMS" };
  }
};

module.exports = {
  sendSms,
  formatIndianPhoneNumber,
};
