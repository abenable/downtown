import crypto from "crypto";
import {
  AbstractPaymentProvider,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CreateAccountHolderInput,
  CreateAccountHolderOutput,
  DeleteAccountHolderInput,
  DeleteAccountHolderOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrieveAccountHolderInput,
  RetrieveAccountHolderOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";

type InjectedDependencies = {
  logger: Logger;
};

type MobileMoneyOptions = {
  network?: "mtn" | "airtel";
  callbackUrl?: string;
  timeoutMs?: number;
  mtnCollectionUrl?: string;
  mtnApiKey?: string;
  mtnAuthToken?: string;
  airtelCollectionUrl?: string;
  airtelApiKey?: string;
  airtelAuthToken?: string;
};

type Network = "mtn" | "airtel";

class BaseMobileMoneyProvider extends AbstractPaymentProvider<MobileMoneyOptions> {
  protected logger_: Logger;
  protected options_: MobileMoneyOptions;
  protected network_: Network;

  constructor(
    { logger }: InjectedDependencies,
    options: MobileMoneyOptions,
    network: Network
  ) {
    super({ logger }, options);
    this.logger_ = logger;
    this.options_ = options;
    this.network_ = network;
  }

  static validateOptions(_: Record<string, unknown>) {
    // Optional validation - provider supports env-driven fallback behavior.
  }

  async getStatus(): Promise<string> {
    return "pending";
  }

  async getPaymentData(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const existingData = (input.data || {}) as Record<string, unknown>;
    const phone = this.normalizePhoneNumber(existingData.phone_number as string | undefined);

    const data: Record<string, unknown> = {
      ...existingData,
      network: this.network_,
      amount: Number(input.amount),
      currency_code: input.currency_code.toUpperCase(),
      phone_number: phone,
      reference: (existingData.reference as string) || `CD-${Date.now()}`,
    };

    return {
      id: (existingData.payment_id as string) || crypto.randomUUID(),
      status: PaymentSessionStatus.PENDING,
      data,
    };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const status = input.data?.status as PaymentSessionStatus | undefined;

    return {
      status: status || PaymentSessionStatus.PENDING,
    };
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
      },
    };
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data || {}) as Record<string, unknown>;
    const phone = this.normalizePhoneNumber(data.phone_number as string | undefined);

    if (!phone) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: {
          ...data,
          status: PaymentSessionStatus.ERROR,
          error: "A valid Uganda phone number is required for mobile money payments.",
        },
      };
    }

    const amount = Number(data.amount || 0);
    const currency = String(data.currency_code || "UGX").toUpperCase();
    const reference = String(data.reference || `CD-${Date.now()}`);

    try {
      const providerResponse = await this.pushPrompt({
        phone,
        amount,
        currency,
        reference,
      });

      return {
        status: PaymentSessionStatus.AUTHORIZED,
        data: {
          ...data,
          network: this.network_,
          phone_number: phone,
          status: PaymentSessionStatus.AUTHORIZED,
          provider_reference: providerResponse.providerReference,
          provider_response: providerResponse.raw,
          prompt_sent_at: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      this.logger_.error(
        `[mobile-money:${this.network_}] Failed to push payment prompt: ${error.message}`
      );

      return {
        status: PaymentSessionStatus.ERROR,
        data: {
          ...data,
          status: PaymentSessionStatus.ERROR,
          error: error.message,
        },
      };
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        amount: Number(input.amount),
        currency_code: input.currency_code,
        network: this.network_,
      },
      status: PaymentSessionStatus.PENDING,
    };
  }

  async deletePayment(_: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return {
      data: {},
    };
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        captured_at: new Date().toISOString(),
      },
    };
  }

  async retrieveAccountHolder(
    input: RetrieveAccountHolderInput
  ): Promise<RetrieveAccountHolderOutput> {
    return {
      id: input.id,
      data: {},
    };
  }

  async createAccountHolder(input: CreateAccountHolderInput): Promise<CreateAccountHolderOutput> {
    return {
      id: input.context.customer.id,
      data: {},
    };
  }

  async deleteAccountHolder(_: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> {
    return {
      data: {},
    };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        refunded_amount: Number(input.amount),
      },
    };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        status: PaymentSessionStatus.CANCELED,
      },
    };
  }

  async getWebhookActionAndData(_: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED };
  }

  protected normalizePhoneNumber(phone?: string): string | null {
    if (!phone) {
      return null;
    }

    const compact = phone.replace(/\s+/g, "");
    if (/^2567\d{8}$/.test(compact)) {
      return compact;
    }

    if (/^07\d{8}$/.test(compact)) {
      return `256${compact.slice(1)}`;
    }

    if (/^\+2567\d{8}$/.test(compact)) {
      return compact.slice(1);
    }

    return null;
  }

  protected async pushPrompt(input: {
    phone: string;
    amount: number;
    currency: string;
    reference: string;
  }): Promise<{ providerReference?: string; raw: unknown }> {
    const timeoutMs = Number(process.env.MOBILE_MONEY_TIMEOUT_MS || this.options_.timeoutMs || 20000);

    const endpoint =
      this.network_ === "mtn"
        ? process.env.MTN_MOMO_COLLECTION_URL || this.options_.mtnCollectionUrl
        : process.env.AIRTEL_MONEY_COLLECTION_URL || this.options_.airtelCollectionUrl;

    if (!endpoint) {
      this.logger_.warn(
        `[mobile-money:${this.network_}] No collection URL configured. Falling back to simulated prompt for ${input.phone}.`
      );

      return {
        providerReference: `sim_${Date.now()}`,
        raw: { simulated: true },
      };
    }

    const apiKey =
      this.network_ === "mtn"
        ? process.env.MTN_MOMO_API_KEY || this.options_.mtnApiKey
        : process.env.AIRTEL_MONEY_API_KEY || this.options_.airtelApiKey;

    const authToken =
      this.network_ === "mtn"
        ? process.env.MTN_MOMO_AUTH_TOKEN || this.options_.mtnAuthToken
        : process.env.AIRTEL_MONEY_AUTH_TOKEN || this.options_.airtelAuthToken;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          phone_number: input.phone,
          amount: input.amount,
          currency: input.currency,
          network: this.network_,
          reference: input.reference,
          external_id: input.reference,
          callback_url: process.env.MOBILE_MONEY_CALLBACK_URL || this.options_.callbackUrl,
          description: `Campus Downtown order payment (${input.reference})`,
        }),
        signal: controller.signal,
      });

      const text = await response.text();
      let result: Record<string, unknown> = {};

      if (text) {
        try {
          result = JSON.parse(text) as Record<string, unknown>;
        } catch {
          result = { raw: text };
        }
      }

      if (!response.ok) {
        throw new Error(
          `Provider request failed (${response.status}): ${JSON.stringify(result)}`
        );
      }

      return {
        providerReference:
          (result.reference as string) ||
          (result.transaction_id as string) ||
          (result.id as string),
        raw: result,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export class MtnMobileMoneyProviderService extends BaseMobileMoneyProvider {
  static identifier = "mtn-mobile-money";

  constructor(deps: InjectedDependencies, options: MobileMoneyOptions) {
    super(deps, options, "mtn");
  }
}

export class AirtelMoneyProviderService extends BaseMobileMoneyProvider {
  static identifier = "airtel-money";

  constructor(deps: InjectedDependencies, options: MobileMoneyOptions) {
    super(deps, options, "airtel");
  }
}
