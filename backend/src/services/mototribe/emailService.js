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

    // Ensure API key is set even if dotenv loaded after initial import
    sgMail.setApiKey(currentApiKey);

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@kaindra.com";

    const msg = {
      to: toEmail,
      from: {
        email: fromEmail,
        name: "Kaindra MotoTribe",
      },
      subject,
      html: htmlBody,
    };

    const response = await sgMail.send(msg);
    const firstResponse = Array.isArray(response) ? response[0] : response;
    return {
      success: true,
      messageId: firstResponse?.headers?.["x-message-id"] || "sg-success",
    };
  } catch (error) {
    console.error("Email Service error:", error.message || error);
    if (error.response?.body) {
      console.error("Email Service SendGrid response body:", JSON.stringify(error.response.body));
    }
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
};

/**
 * Sends a premium Welcome Email to newly registered Kaindra users
 * @param {string} toEmail
 * @param {string} userName
 * @returns {Promise<Object>}
 */
const sendWelcomeEmail = async (toEmail, userName = "Explorer") => {
  const subject = "Welcome to Kaindra | Your Journey Begins Here";
  const firstName = (userName || "Rider").split(" ")[0];

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Kaindra</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0b0b0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0ebe2; }
        .wrapper { width: 100%; max-width: 620px; margin: 0 auto; background-color: #121212; border: 1px solid #292620; border-radius: 14px; overflow: hidden; }
        .header { background: radial-gradient(circle at 50% 0%, #241d13 0%, #121212 100%); padding: 40px 32px 30px; text-align: center; border-bottom: 1px solid #2d2820; }
        .brand { font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #c9a45d; margin: 0; text-transform: uppercase; }
        .tagline { font-size: 11px; letter-spacing: 2px; color: #888277; margin-top: 6px; text-transform: uppercase; }
        .content { padding: 36px 32px; line-height: 1.7; color: #d6d0c4; font-size: 15px; }
        .greeting { font-size: 22px; font-weight: 700; color: #f5f2eb; margin-bottom: 16px; }
        .card { background: #181714; border: 1px solid #312b21; border-radius: 10px; padding: 20px; margin: 24px 0; }
        .card-title { color: #c9a45d; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
        .card-p { margin: 0; color: #a8a296; font-size: 14px; }
        .btn-container { text-align: center; margin: 36px 0 20px; }
        .btn { display: inline-block; background-color: #c9a45d; color: #0d0c0a !important; font-weight: 700; font-size: 13px; letter-spacing: 1.5px; text-decoration: none; padding: 14px 34px; border-radius: 6px; text-transform: uppercase; }
        .footer { padding: 24px 32px; background: #0b0b0b; border-top: 1px solid #201e1a; font-size: 11px; color: #6e6960; text-align: center; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div style="padding: 24px 12px; background-color: #0b0b0b;">
        <div class="wrapper">
          <div class="header">
            <h1 class="brand">KAINDRA</h1>
            <div class="tagline">MotoTribe & ModaSphere Platform</div>
          </div>
          <div class="content">
            <div class="greeting">Welcome, ${firstName}!</div>
            <p>Your Kaindra account is officially active. You now have full access to our interconnected lifestyle and motorcycling ecosystem.</p>
            
            <div class="card">
              <div class="card-title">🏍️ MOTOTRIBE: REAL-TIME RIDER CONNECT</div>
              <p class="card-p">Organize and join group rides, stay in touch with crystal-clear Group Voice & Video Calls powered by Agora RTC, track live convoy routes, and preserve your riding history with Digital Ride Records.</p>
            </div>

            <div class="card">
              <div class="card-title">✨ MODASPHERE: TIMELESS LUXURY</div>
              <p class="card-p">Access curated fashion drops, sustainable heritage apparel, and exclusive member-only collections.</p>
            </div>

            <div class="btn-container">
              <a href="http://localhost:5173/businesses/mototribe" class="btn">ENTER MOTOTRIBE</a>
            </div>

            <p style="font-size: 13px; color: #8a8479; text-align: center;">Need assistance or have feedback? Reply directly to this email or visit your profile settings.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Kaindra Collective. All rights reserved.<br>
            Sent via Kaindra Real-Time Dispatch.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(toEmail, subject, htmlBody);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
};

