import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";

type InjectedDependencies = {
  logger: Logger;
};

type Options = {
  from?: string;
  resendApiKey?: string;
};

// Email templates
const emailTemplates: Record<string, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  "order-placed": (data) => ({
    subject: `Order Confirmation - ${data.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Thank you for your order!</h1>
        <p>Hi ${data.customer_name || "there"},</p>
        <p>Your order <strong>#${data.order_id}</strong> has been placed successfully.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Total:</strong> UGX ${data.total?.toLocaleString() || "0"}</p>
          <p><strong>Items:</strong> ${data.items_count || 0} item(s)</p>
        </div>
        <p>You will receive updates as your order is processed and shipped.</p>
        <p>Thank you for shopping with Downtown!</p>
      </div>
    `,
  }),
  "order-completed": (data) => ({
    subject: `Order Delivered - ${data.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your order has been delivered!</h1>
        <p>Hi ${data.customer_name || "there"},</p>
        <p>Your order <strong>#${data.order_id}</strong> has been delivered.</p>
        <p>We hope you enjoy your purchase! If you have any questions, please contact our support team.</p>
        <p>Thank you for shopping with Downtown!</p>
      </div>
    `,
  }),
  "vendor-approved": (data) => ({
    subject: "Welcome to Downtown! Your vendor account is approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Congratulations! You're now a Downtown vendor!</h1>
        <p>Hi ${data.vendor_name || "there"},</p>
        <p>Your vendor application has been approved. You can now start listing products on Downtown.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Next steps:</strong></p>
          <ol>
            <li>Set up your payment settings for payouts</li>
            <li>Add your first products</li>
            <li>Start selling!</li>
          </ol>
        </div>
        <a href="${data.dashboard_url || "#"}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Go to Vendor Dashboard</a>
      </div>
    `,
  }),
  "vendor-rejected": (data) => ({
    subject: "Vendor Application Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Vendor Application Update</h1>
        <p>Hi ${data.vendor_name || "there"},</p>
        <p>Unfortunately, your vendor application has not been approved at this time.</p>
        ${data.rejection_reason ? `<p><strong>Reason:</strong> ${data.rejection_reason}</p>` : ""}
        <p>You're welcome to reapply with updated information. If you have questions, please contact our support team.</p>
      </div>
    `,
  }),
  "payout-processed": (data) => ({
    subject: `Payout Sent - UGX ${data.amount?.toLocaleString() || "0"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your payout has been sent!</h1>
        <p>Hi ${data.vendor_name || "there"},</p>
        <p>A payout of <strong>UGX ${data.amount?.toLocaleString() || "0"}</strong> has been sent to your mobile money account.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Phone:</strong> ${data.phone_number || "N/A"}</p>
          <p><strong>Network:</strong> ${typeof data.network === 'string' ? data.network.toUpperCase() : "N/A"}</p>
          <p><strong>Reference:</strong> ${data.reference || "N/A"}</p>
        </div>
        <p>The funds should arrive in your account shortly.</p>
      </div>
    `,
  }),
};

/**
 * Email Notification Provider with Resend integration
 */
class EmailNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "email-notification";

  protected logger_: Logger;
  protected options_: Options;
  protected resendApiKey_: string | undefined;

  constructor({ logger }: InjectedDependencies, options: Options) {
    super();
    this.logger_ = logger;
    this.options_ = options;
    this.resendApiKey_ = process.env.RESEND_API_KEY || options.resendApiKey;
  }

  static validateOptions(options: Record<string, unknown>) {
    // Options are optional - falls back to logging in development
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification;
    const from = this.options_.from || process.env.EMAIL_FROM || "noreply@campusdowntown.com";

    // Get template
    const templateFn = emailTemplates[template];
    const emailContent = templateFn
      ? templateFn(data as Record<string, unknown>)
      : { subject: template, html: JSON.stringify(data) };

    // If Resend API key is configured, send via Resend
    if (this.resendApiKey_) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.resendApiKey_}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: Array.isArray(to) ? to : [to],
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          this.logger_.error(`Resend API error: ${JSON.stringify(result)}`);
          throw new Error(result.message || "Failed to send email");
        }

        this.logger_.info(`Email sent via Resend to ${to}: ${emailContent.subject}`);

        return {
          id: result.id || `resend_${Date.now()}`,
        };
      } catch (error: any) {
        this.logger_.error(`Failed to send email: ${error.message}`);
        // Fall back to logging
      }
    }

    // In development or if Resend fails, log the notification
    this.logger_.info(`
================================================================================
EMAIL NOTIFICATION
================================================================================
To: ${to}
From: ${from}
Subject: ${emailContent.subject}
Template: ${template}
--------------------------------------------------------------------------------
${emailContent.html}
================================================================================
    `);

    return {
      id: `email_${Date.now()}`,
    };
  }
}

export default EmailNotificationProviderService;
