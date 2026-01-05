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
  templatePath?: string;
};

/**
 * Email Notification Provider
 *
 * A simple email notification provider for the Downtown marketplace.
 * In development, it logs notifications to the console.
 * In production, you can extend this to use SendGrid, Resend, or other providers.
 */
class EmailNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "email-notification";

  protected logger_: Logger;
  protected options_: Options;

  constructor({ logger }: InjectedDependencies, options: Options) {
    super();
    this.logger_ = logger;
    this.options_ = options;
  }

  static validateOptions(options: Record<string, unknown>) {
    // Options are optional for the local provider
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification;

    // In development, log the notification
    this.logger_.info(`
================================================================================
📧 EMAIL NOTIFICATION
================================================================================
To: ${to}
Template: ${template}
From: ${this.options_.from || "noreply@campusdowntown.com"}
Data: ${JSON.stringify(data, null, 2)}
================================================================================
    `);

    // Return success response
    return {
      id: `email_${Date.now()}`,
    };
  }
}

export default EmailNotificationProviderService;
