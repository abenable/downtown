import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import {
  CreatePaymentProviderSession,
  Logger,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
  WebhookActionResult,
} from "@medusajs/framework/types";
import crypto from "crypto";

type FlutterwaveOptions = {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  testMode?: boolean;
};

type InjectedDependencies = {
  logger: Logger;
};

interface FlutterwaveChargeResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    currency: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      phone_number: string;
      name: string;
      email: string;
    };
  };
  meta?: {
    authorization?: {
      mode: string;
      redirect?: string;
    };
  };
}

/**
 * Flutterwave Payment Provider for Mobile Money (MTN MoMo, Airtel Money)
 * Supports Uganda Mobile Money collections
 */
class FlutterwavePaymentProviderService extends AbstractPaymentProvider<FlutterwaveOptions> {
  static identifier = "flutterwave";

  protected logger_: Logger;
  protected options_: FlutterwaveOptions;
  protected baseUrl: string;

  constructor(
    { logger }: InjectedDependencies,
    options: FlutterwaveOptions
  ) {
    super({ logger }, options);
    this.logger_ = logger;
    this.options_ = options;
    this.baseUrl = "https://api.flutterwave.com/v3";
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Flutterwave secret key is required"
      );
    }
    if (!options.publicKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Flutterwave public key is required"
      );
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.options_.secretKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger_.error(`Flutterwave API error: ${JSON.stringify(data)}`);
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        data.message || "Flutterwave API error"
      );
    }

    return data as T;
  }

  /**
   * Generate a unique transaction reference
   */
  private generateTxRef(sessionId: string): string {
    return `DTN_${sessionId}_${Date.now()}`;
  }

  /**
   * Initialize a payment session
   */
  async initiatePayment(
    input: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code, context } = input;

    try {
      const txRef = this.generateTxRef(context.session_id as string);

      // Store initial session data
      return {
        data: {
          tx_ref: txRef,
          amount: amount,
          currency: currency_code.toUpperCase(),
          status: "pending",
          payment_type: null, // Will be set when customer selects MTN/Airtel
          phone_number: null,
          customer_email: context.email || context.customer?.email,
          customer_name: context.customer?.first_name
            ? `${context.customer.first_name} ${context.customer.last_name || ""}`
            : undefined,
        },
      };
    } catch (error: any) {
      return {
        error: error.message,
        code: "PAYMENT_INITIATION_ERROR",
        detail: error,
      };
    }
  }

  /**
   * Update payment session with phone number and network
   */
  async updatePayment(
    input: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { data, amount, currency_code, context } = input;

    try {
      return {
        data: {
          ...data,
          amount: amount,
          currency: currency_code.toUpperCase(),
          customer_email: context.email || context.customer?.email || data.customer_email,
        },
      };
    } catch (error: any) {
      return {
        error: error.message,
        code: "PAYMENT_UPDATE_ERROR",
        detail: error,
      };
    }
  }

  /**
   * Authorize payment - initiates Mobile Money charge
   */
  async authorizePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProviderError | { status: PaymentSessionStatus; data: Record<string, unknown> }
  > {
    const { phone_number, network, tx_ref, amount, currency, customer_email, customer_name } =
      paymentSessionData;

    if (!phone_number || !network) {
      return {
        error: "Phone number and network are required for Mobile Money payment",
        code: "MISSING_PAYMENT_DETAILS",
      };
    }

    try {
      // Initiate Mobile Money charge
      const chargeResponse = await this.makeRequest<FlutterwaveChargeResponse>(
        "/charges?type=mobile_money_uganda",
        "POST",
        {
          tx_ref,
          amount,
          currency: currency || "UGX",
          phone_number,
          network: (network as string).toUpperCase(), // MTN or AIRTEL
          email: customer_email || "customer@downtown.ug",
          fullname: customer_name || "Downtown Customer",
        }
      );

      if (chargeResponse.status === "success") {
        const chargeData = chargeResponse.data;

        // Check if the charge requires redirect (USSD prompt sent to user)
        if (chargeResponse.meta?.authorization?.mode === "redirect") {
          return {
            status: PaymentSessionStatus.REQUIRES_MORE,
            data: {
              ...paymentSessionData,
              flw_ref: chargeData?.flw_ref,
              flw_charge_id: chargeData?.id,
              processor_response: chargeData?.processor_response,
              authorization_mode: "redirect",
              redirect_url: chargeResponse.meta.authorization.redirect,
            },
          };
        }

        // Payment initiated, waiting for customer to confirm on phone
        if (chargeData?.status === "pending") {
          return {
            status: PaymentSessionStatus.PENDING,
            data: {
              ...paymentSessionData,
              flw_ref: chargeData.flw_ref,
              flw_charge_id: chargeData.id,
              processor_response: chargeData.processor_response,
            },
          };
        }

        // Payment successful
        if (chargeData?.status === "successful") {
          return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: {
              ...paymentSessionData,
              flw_ref: chargeData.flw_ref,
              flw_charge_id: chargeData.id,
              charged_amount: chargeData.charged_amount,
            },
          };
        }
      }

      return {
        error: chargeResponse.message || "Mobile Money charge failed",
        code: "CHARGE_FAILED",
      };
    } catch (error: any) {
      this.logger_.error(`Flutterwave authorize error: ${error.message}`);
      return {
        error: error.message,
        code: "AUTHORIZATION_ERROR",
        detail: error,
      };
    }
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    // For Mobile Money, capture is automatic after authorization
    return {
      ...paymentSessionData,
      captured_at: new Date().toISOString(),
    };
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return {
      ...paymentSessionData,
      cancelled_at: new Date().toISOString(),
    };
  }

  /**
   * Delete a payment session
   */
  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return paymentSessionData;
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const { flw_charge_id } = paymentSessionData;

    if (!flw_charge_id) {
      return {
        error: "No Flutterwave charge ID found for refund",
        code: "REFUND_ERROR",
      };
    }

    try {
      const refundResponse = await this.makeRequest<{ status: string; data: any }>(
        `/transactions/${flw_charge_id}/refund`,
        "POST",
        { amount: refundAmount }
      );

      if (refundResponse.status === "success") {
        return {
          ...paymentSessionData,
          refund_id: refundResponse.data?.id,
          refunded_amount: refundAmount,
          refunded_at: new Date().toISOString(),
        };
      }

      return {
        error: "Refund failed",
        code: "REFUND_FAILED",
      };
    } catch (error: any) {
      return {
        error: error.message,
        code: "REFUND_ERROR",
        detail: error,
      };
    }
  }

  /**
   * Retrieve payment status
   */
  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const { tx_ref } = paymentSessionData;

    if (!tx_ref) {
      return paymentSessionData;
    }

    try {
      const verifyResponse = await this.makeRequest<{ status: string; data: any }>(
        `/transactions/verify_by_reference?tx_ref=${tx_ref}`,
        "GET"
      );

      if (verifyResponse.status === "success" && verifyResponse.data) {
        return {
          ...paymentSessionData,
          flw_status: verifyResponse.data.status,
          flw_ref: verifyResponse.data.flw_ref,
          charged_amount: verifyResponse.data.charged_amount,
        };
      }

      return paymentSessionData;
    } catch {
      // Transaction not found or pending
      return paymentSessionData;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    const { flw_status, tx_ref } = paymentSessionData;

    if (flw_status === "successful") {
      return PaymentSessionStatus.AUTHORIZED;
    }

    if (flw_status === "failed") {
      return PaymentSessionStatus.ERROR;
    }

    // Check with Flutterwave if we have a tx_ref
    if (tx_ref) {
      try {
        const verifyResponse = await this.makeRequest<{ status: string; data: any }>(
          `/transactions/verify_by_reference?tx_ref=${tx_ref}`,
          "GET"
        );

        if (verifyResponse.data?.status === "successful") {
          return PaymentSessionStatus.AUTHORIZED;
        }
        if (verifyResponse.data?.status === "failed") {
          return PaymentSessionStatus.ERROR;
        }
      } catch {
        // Transaction not found or still pending
      }
    }

    return PaymentSessionStatus.PENDING;
  }

  /**
   * Handle incoming webhooks from Flutterwave
   */
  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data, rawData, headers } = payload;

    // Verify webhook signature
    if (this.options_.webhookSecret) {
      const signature = headers?.["verif-hash"];
      if (signature !== this.options_.webhookSecret) {
        this.logger_.warn("Invalid Flutterwave webhook signature");
        return { action: PaymentActions.NOT_SUPPORTED };
      }
    }

    const eventData = (data as any)?.data || data;
    const txRef = eventData?.tx_ref;
    const status = eventData?.status;

    if (!txRef) {
      return { action: PaymentActions.NOT_SUPPORTED };
    }

    if (status === "successful") {
      return {
        action: PaymentActions.AUTHORIZED,
        data: {
          session_id: this.extractSessionId(txRef),
          amount: eventData.amount,
        },
      };
    }

    if (status === "failed") {
      return {
        action: PaymentActions.FAILED,
        data: {
          session_id: this.extractSessionId(txRef),
          amount: eventData.amount,
        },
      };
    }

    return { action: PaymentActions.NOT_SUPPORTED };
  }

  /**
   * Extract session ID from transaction reference
   */
  private extractSessionId(txRef: string): string {
    // Format: DTN_{sessionId}_{timestamp}
    const parts = txRef.split("_");
    return parts.length >= 2 ? parts[1] : txRef;
  }
}

export default FlutterwavePaymentProviderService;
