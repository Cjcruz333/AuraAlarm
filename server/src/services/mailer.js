import nodemailer from 'nodemailer';

/**
 * Returns a nodemailer transporter if SMTP credentials are fully configured.
 * Does not add or require any paid service; returns null if SMTP env vars are absent.
 */
export const getMailer = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !Number.isInteger(port) || port < 1) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
};

/**
 * Sends a VIP Plan Activation Confirmation email to the customer if SMTP is available.
 * If SMTP is not configured, logs cleanly and returns without throwing.
 */
export const sendPaymentConfirmationEmail = async ({
  userEmail,
  userName,
  planName,
  amount,
  currency,
  expiresAt
}) => {
  const mailer = getMailer();
  if (!mailer) {
    console.log('[Mailer] SMTP not configured. Skipping confirmation email to', userEmail);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@auraalarm.app';
  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, { dateStyle: 'long' })
    : 'Lifetime Pass (No expiration)';

  const textContent = `Hello ${userName || 'AuraAlarm Member'},

Your payment for ${planName} (${currency} ${amount}) has been confirmed!

Your VIP Pro features are now fully active until: ${formattedExpiry}.

Thank you for choosing AuraAlarm. If you ever have questions or need assistance, reply directly to this email or reach out to okeke12347@gmail.com.

Warm regards,
Okeke Chiemeria John
Creator, AuraAlarm
Nigeria`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-top: 0;">Your VIP Plan is Active!</h2>
      <p>Hello <strong>${userName || 'AuraAlarm Member'}</strong>,</p>
      <p>We are pleased to confirm that your manual bank transfer payment for <strong>${planName}</strong> has been verified.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Plan:</strong> ${planName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ${currency} ${amount}</p>
        <p style="margin: 0;"><strong>Active Until:</strong> ${formattedExpiry}</p>
      </div>

      <p>All premium sleep sounds, unlimited arrival geofences, and couple features are now unlocked on your account.</p>
      <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
        Need help or have questions? Email us at <a href="mailto:okeke12347@gmail.com" style="color: #4f46e5;">okeke12347@gmail.com</a>.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Built and run by Okeke Chiemeria John, Nigeria.<br />
        <a href="https://auraalarm.web.app" style="color: #94a3b8;">AuraAlarm</a>
      </p>
    </div>
  `;

  try {
    const info = await mailer.sendMail({
      from,
      to: userEmail,
      subject: `🎉 Your AuraAlarm VIP Plan is Active! (${planName})`,
      text: textContent,
      html: htmlContent
    });
    console.log('[Mailer] Confirmation email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Mailer] Error sending confirmation email:', err);
    return { sent: false, error: err.message };
  }
};
