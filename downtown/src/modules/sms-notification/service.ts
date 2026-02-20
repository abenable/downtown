import { AbstractNotificationProviderService } from "@medusajs/framework/utils";
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
  senderId?: string;
  messageType?: "transactional" | "promotional";
  baseUrl?: string;
};

const smsTemplates: Record<string, (data: Record<string, unknown>) => string> = {
  "order-placed": (data) =>
    `Campus Downtown: Order #${data.order_id} placed. Total UGX ${data.total?.toLocaleString() || "0"}.`,
  "order-shipped": (data) =>
    `Campus Downtown: Order #${data.order_id} is on the way.`,
  "order-delivered": (data) =>
    `Campus Downtown: Order #${data.order_id} delivered. Thank you for shopping with us.`,
  "vendor-approved": (data) =>
    `Campus Downtown: Vendor account ${data.vendor_name || ""} approved.`,
  "payout-sent": (data) =>
    `Campus Downtown: Payout of UGX ${data.amount?.toLocaleString() || "0"} sent. Ref ${data.reference || "N/A"}.`,
  "payment-received": (data) =>
    `Campus Downtown: Payment of UGX ${data.amount?.toLocaleString() || "0"} received for order #${data.order_id}.`,
};

class SmsNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "sms-notification";

  protected logger_: Logger;
  protected apiKey_: string | undefined;
  protected senderId_: string;
  protected messageType_: "transactional" | "promotional";
  protected baseUrl_: string;

  constructor({ logger }: InjectedDependencies, options: Options) {
    super();
    this.logger_ = logger;
    this.apiKey_ = process.env.UGSMS_API_KEY || options.apiKey;
    this.senderId_ = process.env.UGSMS_SENDER_ID || options.senderId || "Downtown";
    this.messageType_ =
      (process.env.UGSMS_MESSAGE_TYPE as "transactional" | "promotional") ||
      options.messageType ||
      "transactional";
    this.baseUrl_ = process.env.UGSMS_BASE_URL || options.baseUrl || "https://ugsms.com";
  }

  static validateOptions(_: Record<string, unknown>) {
    // Optional. Runtime gracefully falls back to logging if credentials are missing.
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification;

    const phoneNumber = this.normalizeUgandanPhone(to);
    const templateFn = smsTemplates[template];
    const message = templateFn
      ? templateFn(data as Record<string, unknown>)
      : `Campus Downtown: ${JSON.stringify(data)}`;

    if (!this.apiKey_) {
      this.logFallback(phoneNumber, template, message, "UGSMS_API_KEY is not configured");
      return { id: `sms_${Date.now()}` };
    }

    const response = await fetch(`${this.baseUrl_}/api/v2/sms/send`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey_,
      },
      body: JSON.stringify({
        sender_id: this.senderId_,
        message_body: message,
        phone_number: phoneNumber,
        message_type: this.messageType_,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      this.logFallback(
        phoneNumber,
        template,
        message,
        `UG-SMS API error (${response.status}): ${JSON.stringify(result)}`
      );
      return { id: `sms_${Date.now()}` };
    }

    this.logger_.info(`UG-SMS sent to ${phoneNumber}: ${template}`);

    return {
      id:
        (result?.data?.message_id as string) ||
        (result?.message_id as string) ||
        `ugsms_${Date.now()}`,
    };
  }

  private normalizeUgandanPhone(input: string): string {
    const compact = input.replace(/\s+/g, "");

    if (/^2567\d{8}$/.test(compact)) {
      return compact;
    }

    if (/^07\d{8}$/.test(compact)) {
      return `256${compact.slice(1)}`;
    }

    if (/^\+2567\d{8}$/.test(compact)) {
      return compact.slice(1);
    }

    return compact.replace(/^\+/, "");
  }

  private logFallback(
    phoneNumber: string,
    template: string,
    message: string,
    reason: string
  ) {
    this.logger_.warn(`SMS fallback for ${phoneNumber}: ${reason}`);
    this.logger_.info(`\n=== SMS NOTIFICATION ===\nTo: ${phoneNumber}\nTemplate: ${template}\nMessage: ${message}\n========================`);
  }
}

export default SmsNotificationProviderService;
