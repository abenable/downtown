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

type IotecPayOptions = {
  apiBaseUrl?: string;
  tokenUrl?: string;
  walletId?: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  timeoutMs?: number;
};

type MobileNetwork = "mtn" | "airtel";
type IotecCollectionStatus =
  | "Pending"
  | "SentToVendor"
  | "Success"
  | "Failed"
  | "AwaitingApproval"
  | "RolledBack"
  | "Scheduled"
  | "Cancelled"
  | "Rejected";

class IotecPayProviderService extends AbstractPaymentProvider<IotecPayOptions> {
  static identifier = "iotec-pay";

  protected logger_: Logger;
  protected options_: IotecPayOptions;
  protected accessToken_: string | null = null;
  protected accessTokenExpiresAt_: number = 0;

  constructor({ logger }: InjectedDependencies, options: IotecPayOptions) {
    super({ logger }, options);
    this.logger_ = logger;
    this.options_ = options;
  }

  static validateOptions(_: Record<string, unknown>) {
    // Credentials can be provided through environment variables.
  }

  async getStatus(): Promise<string> {
    return "pending";
  }

  async getPaymentData(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const existingData = (input.data || {}) as Record<string, unknown>;
    const reference = (existingData.reference as string) || `CD-${Date.now()}`;
    const externalId =
      (existingData.external_id as string) ||
      (existingData.externalId as string) ||
      reference;
    const phone = this.normalizePhoneNumber(existingData.phone_number as string | undefined);
    const network = this.normalizeNetwork(existingData.network as string | undefined);

    const data: Record<string, unknown> = {
      ...existingData,
      amount: Number(input.amount),
      currency_code: String(input.currency_code || "UGX").toUpperCase(),
      phone_number: phone,
      network,
      reference,
      external_id: externalId,
      provider_status: (existingData.provider_status as string) || "Pending",
    };

    return {
      id: (existingData.payment_id as string) || crypto.randomUUID(),
      status: PaymentSessionStatus.PENDING,
      data,
    };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = (input.data || {}) as Record<string, unknown>;
    const providerStatus = data.provider_status as IotecCollectionStatus | undefined;
    return { status: this.mapPaymentSessionStatus(providerStatus) };
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = { ...((input.data || {}) as Record<string, unknown>) };
    const externalId =
      (data.external_id as string) || (data.externalId as string) || undefined;

    if (externalId) {
      try {
        const latest = await this.fetchCollectionByExternalId(externalId);

        if (latest) {
          const providerStatus = String(
            latest.status || latest.state || data.provider_status || "Pending"
          ) as IotecCollectionStatus;

          return {
            data: {
              ...data,
              provider_status: providerStatus,
              provider_reference:
                (latest.id as string) ||
                (latest.requestId as string) ||
                (latest.externalId as string) ||
                data.provider_reference,
              provider_response: latest,
              status: this.mapPaymentSessionStatus(providerStatus),
              last_status_check_at: new Date().toISOString(),
            },
          };
        }
      } catch (error: any) {
        this.logger_.warn(
          `[iotec-pay] Failed to refresh collection status for ${externalId}: ${error.message}`
        );
      }
    }

    return { data };
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
          error: "A valid Uganda phone number is required.",
        },
      };
    }

    const amount = Number(data.amount || 0);
    if (!Number.isFinite(amount) || amount < 500) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: {
          ...data,
          status: PaymentSessionStatus.ERROR,
          error: "Amount must be at least 500.",
        },
      };
    }

    const currency = String(data.currency_code || "UGX").toUpperCase();
    const reference = String(data.reference || `CD-${Date.now()}`);
    const externalId = String(data.external_id || reference);

    try {
      const providerResponse = await this.initiateCollection({
        phone,
        amount,
        currency,
        externalId,
        reference,
        network: this.normalizeNetwork(data.network as string | undefined),
      });

      const providerStatus = String(
        providerResponse.status || providerResponse.state || "Pending"
      ) as IotecCollectionStatus;
      const paymentStatus = this.mapPaymentSessionStatus(providerStatus);

      return {
        status:
          paymentStatus === PaymentSessionStatus.ERROR
            ? PaymentSessionStatus.ERROR
            : PaymentSessionStatus.AUTHORIZED,
        data: {
          ...data,
          status:
            paymentStatus === PaymentSessionStatus.ERROR
              ? PaymentSessionStatus.ERROR
              : PaymentSessionStatus.AUTHORIZED,
          phone_number: phone,
          provider_status: providerStatus,
          provider_reference:
            providerResponse.id ||
            providerResponse.requestId ||
            providerResponse.externalId,
          provider_response: providerResponse,
          external_id: externalId,
          payment_authorization_state: paymentStatus,
          prompt_sent_at: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      this.logger_.error(`[iotec-pay] Failed to initiate collection: ${error.message}`);
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
    const data = (input.data || {}) as Record<string, unknown>;

    return {
      data: {
        ...data,
        amount: Number(input.amount),
        currency_code: String(input.currency_code || "UGX").toUpperCase(),
        phone_number: this.normalizePhoneNumber(data.phone_number as string | undefined),
        network: this.normalizeNetwork(data.network as string | undefined),
        reference: (data.reference as string) || `CD-${Date.now()}`,
        external_id:
          (data.external_id as string) ||
          (data.externalId as string) ||
          (data.reference as string) ||
          `CD-${Date.now()}`,
      },
      status: PaymentSessionStatus.PENDING,
    };
  }

  async deletePayment(_: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: {} };
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
    return { id: input.id, data: {} };
  }

  async createAccountHolder(input: CreateAccountHolderInput): Promise<CreateAccountHolderOutput> {
    return { id: input.context.customer.id, data: {} };
  }

  async deleteAccountHolder(_: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> {
    return { data: {} };
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

  private normalizePhoneNumber(phone?: string): string | null {
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

  private normalizeNetwork(network?: string): MobileNetwork | null {
    if (!network) {
      return null;
    }

    const normalized = network.toLowerCase();
    if (normalized === "mtn" || normalized === "airtel") {
      return normalized;
    }

    return null;
  }

  private mapPaymentSessionStatus(status?: IotecCollectionStatus) {
    switch (status) {
      case "Success":
        return PaymentSessionStatus.AUTHORIZED;
      case "Failed":
      case "RolledBack":
      case "Cancelled":
      case "Rejected":
        return PaymentSessionStatus.ERROR;
      case "Pending":
      case "SentToVendor":
      case "AwaitingApproval":
      case "Scheduled":
      default:
        return PaymentSessionStatus.PENDING;
    }
  }

  private getConfig() {
    return {
      apiBaseUrl:
        process.env.IOTEC_PAY_API_BASE_URL ||
        this.options_.apiBaseUrl ||
        "https://pay.iotec.io",
      tokenUrl:
        process.env.IOTEC_PAY_TOKEN_URL ||
        this.options_.tokenUrl ||
        "https://id.iotec.io/connect/token",
      walletId: process.env.IOTEC_PAY_WALLET_ID || this.options_.walletId,
      clientId: process.env.IOTEC_PAY_CLIENT_ID || this.options_.clientId,
      clientSecret:
        process.env.IOTEC_PAY_CLIENT_SECRET || this.options_.clientSecret,
      callbackUrl:
        process.env.IOTEC_PAY_CALLBACK_URL || this.options_.callbackUrl,
      timeoutMs: Number(
        process.env.IOTEC_PAY_TIMEOUT_MS || this.options_.timeoutMs || 20000
      ),
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken_ && Date.now() < this.accessTokenExpiresAt_) {
      return this.accessToken_;
    }

    const config = this.getConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error(
        "iOTEC Pay credentials missing. Set IOTEC_PAY_CLIENT_ID and IOTEC_PAY_CLIENT_SECRET."
      );
    }

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.access_token) {
      throw new Error(
        `Failed to get iOTEC access token: ${response.status} ${JSON.stringify(result)}`
      );
    }

    this.accessToken_ = result.access_token as string;
    const ttlSeconds = Number(result.expires_in || 300);
    this.accessTokenExpiresAt_ = Date.now() + Math.max(ttlSeconds - 30, 30) * 1000;

    return this.accessToken_;
  }

  private async initiateCollection(input: {
    phone: string;
    amount: number;
    currency: string;
    externalId: string;
    reference: string;
    network: MobileNetwork | null;
  }): Promise<Record<string, unknown>> {
    const config = this.getConfig();

    if (!config.walletId) {
      this.logger_.warn(
        "[iotec-pay] IOTEC_PAY_WALLET_ID not configured. Using simulated success."
      );
      return {
        id: `sim_${Date.now()}`,
        status: "Pending",
        externalId: input.externalId,
        simulated: true,
      };
    }

    const token = await this.getAccessToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/collections/collect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "MobileMoney",
          currency: input.currency,
          walletId: config.walletId,
          externalId: input.externalId,
          payer: input.phone,
          amount: input.amount,
          payerNote: `Campus Downtown order payment (${input.reference})`,
          payeeNote: "Campus Downtown checkout",
          channel: input.network || undefined,
          callbackUrl: config.callbackUrl,
        }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `iOTEC collection failed (${response.status}): ${JSON.stringify(result)}`
        );
      }

      return result as Record<string, unknown>;
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchCollectionByExternalId(
    externalId: string
  ): Promise<Record<string, unknown> | null> {
    const config = this.getConfig();

    if (!config.walletId) {
      return null;
    }

    const token = await this.getAccessToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/collections/external-id/${encodeURIComponent(
          externalId
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      if (response.status === 404) {
        return null;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `iOTEC collection lookup failed (${response.status}): ${JSON.stringify(result)}`
        );
      }

      return result as Record<string, unknown>;
    } finally {
      clearTimeout(timer);
    }
  }
}

export default IotecPayProviderService;
