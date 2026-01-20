import {
  AbstractNotificationProviderService,
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
  apiKey?: string;
  username?: string;
  senderId?: string;
};

// SMS templates
const smsTemplates: Record<string, (data: Record<string, unknown>) => string> = {
  "order-placed": (data) =>
    `Downtown: Your order #${data.order_id} has been placed! Total: UGX ${data.total?.toLocaleString() || "0"}. Track at ${data.tracking_url || "downtown.ug"}`,
  "order-shipped": (data) =>
    `Downtown: Your order #${data.order_id} is on its way! Expected delivery: ${data.delivery_date || "Soon"}`,
  "order-delivered": (data) =>
    `Downtown: Your order #${data.order_id} has been delivered. Thank you for shopping with Downtown!`,
  "vendor-approved": (data) =>
    `Downtown: Congratulations! Your vendor account "${data.vendor_name}" has been approved. Start selling now!`,
  "payout-sent": (data) =>
    `Downtown: Payout of UGX ${data.amount?.toLocaleString() || "0"} sent to ${data.phone_number}. Ref: ${data.reference || "N/A"}`,
  "payment-received": (data) =>
    `Downtown: Payment of UGX ${data.amount?.toLocaleString() || "0"} received for order #${data.order_id}. Thank you!`,
};

/**
 * SMS Notification Provider using Africa's Talking API
 * Great coverage for Uganda and East Africa
 */
class SmsNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "sms-notification";

  protected logger_: Logger;
  protected options_: Options;
  protected apiKey_: string | undefined;
  protected username_: string | undefined;
  protected senderId_: string | undefined;

  constructor({ logger }: InjectedDependencies, options: Options) {
    super();
    this.logger_ = logger;
    this.options_ = options;
    this.apiKey_ = process.env.AFRICASTALKING_API_KEY || options.apiKey;
    this.username_ = process.env.AFRICASTALKING_USERNAME || options.username || "sandbox";
    this.senderId_ = process.env.AFRICASTALKING_SENDER_ID || options.senderId || "Downtown";
  }

  static validateOptions(options: Record<string, unknown>) {
    // Options are optional - falls back to logging in development
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification;

    // Get SMS content from template
    const templateFn = smsTemplates[template];
    const message = templateFn
      ? templateFn(data as Record<string, unknown>)
      : `Downtown: ${JSON.stringify(data)}`;

    // Format phone number for Africa's Talking (needs country code)
    let phoneNumber = to.replace(/\s/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "+256" + phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith("+")) {
      phoneNumber = "+" + phoneNumber;
    }

    // If API key is configured, send via Africa's Talking
    if (this.apiKey_ && this.apiKey_ !== "sandbox") {
      try {
        const response = await fetch("https://api.africastalking.com/version1/messaging", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            apiKey: this.apiKey_,
          },
          body: new URLSearchParams({
            username: this.username_!,
            to: phoneNumber,
            message: message,
            from: this.senderId_!,
          }),
        });

        const result = await response.json();

        if (result.SMSMessageData?.Recipients?.[0]?.status === "Success") {
          this.logger_.info(`SMS sent to ${phoneNumber}: ${template}`);
          return {
            id: result.SMSMessageData.Recipients[0].messageId || `sms_${Date.now()}`,
          };
        }

        this.logger_.warn(`SMS sending issue: ${JSON.stringify(result)}`);
      } catch (error: any) {
        this.logger_.error(`Failed to send SMS: ${error.message}`);
      }
    }

    // In development or if Africa's Talking fails, log the notification
    this.logger_.info(`
================================================================================
SMS NOTIFICATION
================================================================================
To: ${phoneNumber}
Template: ${template}
Message: ${message}
================================================================================
    `);

    return {
      id: `sms_${Date.now()}`,
    };
  }
}

export default SmsNotificationProviderService;
