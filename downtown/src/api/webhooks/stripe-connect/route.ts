import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { STRIPE_CONNECT_MODULE } from "../../../modules/stripe-connect";
import StripeConnectService from "../../../modules/stripe-connect/service";
import Stripe from "stripe";

/**
 * POST /webhooks/stripe-connect
 *
 * Handles webhook events from Stripe Connect.
 *
 * This endpoint receives thin events from the Stripe V2 API. Thin events only
 * contain the event ID - we need to fetch the full event data from Stripe.
 *
 * Important: The Stripe SDK automatically validates the webhook signature
 * using the STRIPE_WEBHOOK_SECRET environment variable.
 *
 * Required environment variables:
 * - STRIPE_API_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Your webhook signing secret (whsec_...)
 *
 * To set up webhooks:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Click "+ Add destination"
 * 3. In the "Events from" section, select "Connected accounts"
 * 4. Click "Show advanced options" and select "Thin" in the Payload style section
 * 5. In the Events field, select:
 *    - v2.core.account[requirements].updated
 *    - v2.core.account[.recipient].capability_status_updated
 * 6. Set the endpoint URL to your webhook URL
 *
 * For local development, use the Stripe CLI:
 * stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' --forward-thin-to http://localhost:9000/webhooks/stripe-connect
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // Step 1: Validate STRIPE_API_KEY environment variable
  const stripeApiKey = process.env.STRIPE_API_KEY;
  if (!stripeApiKey) {
    console.error("[Stripe Connect Webhook] Error: STRIPE_API_KEY environment variable is not set");
    return res.status(500).json({
      message: "Stripe API key is not configured",
      error: "MISSING_STRIPE_API_KEY",
    });
  }

  // Step 2: Validate STRIPE_WEBHOOK_SECRET environment variable
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Connect Webhook] Error: STRIPE_WEBHOOK_SECRET environment variable is not set");
    return res.status(500).json({
      message: "Webhook secret is not configured",
      error: "MISSING_WEBHOOK_SECRET",
    });
  }

  // Step 3: Initialize Stripe client
  const stripeClient = new Stripe(stripeApiKey);

  // Step 4: Get the Stripe Connect service from the container
  const stripeConnectService: StripeConnectService = req.scope.resolve(
    STRIPE_CONNECT_MODULE
  );

  // Step 5: Get the webhook signature from the request headers
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    console.error("[Stripe Connect Webhook] Error: Missing Stripe signature header");
    return res.status(400).json({
      message: "Missing Stripe signature header",
      error: "MISSING_SIGNATURE",
    });
  }

  // Step 6: Parse and verify the webhook event
  // Stripe SDK automatically validates the signature
  let event: Stripe.Event;
  try {
    // For standard events, we use constructEvent
    event = stripeClient.webhooks.constructEvent(
      JSON.stringify(req.body),
      signature,
      webhookSecret
    );

    console.log(`[Stripe Connect Webhook] Received event: ${event.type} (ID: ${event.id})`);

  } catch (error: any) {
    console.error("[Stripe Connect Webhook] Error verifying webhook signature:", error);
    return res.status(400).json({
      message: "Invalid webhook signature",
      error: error.message,
    });
  }

  // Step 7: Handle the event
  try {

    console.log(`[Stripe Connect Webhook] Fetched full event: ${event.type}`);

    // Step 8: Handle the event based on its type
    switch (event.type) {
      case "account.updated": {
        // Handle account updates
        // This event is sent when account details or requirements change
        await handleAccountUpdated(event, stripeClient, stripeConnectService);
        break;
      }

      case "capability.updated": {
        // Handle capability status updates
        // This event is sent when a capability status changes (e.g., transfers capability becomes active)
        await handleCapabilityUpdated(event, stripeClient, stripeConnectService);
        break;
      }

      default:
        console.log(`[Stripe Connect Webhook] Unhandled event type: ${event.type}`);
    }

    // Step 9: Return success
    // Stripe expects a 200 OK response to acknowledge the webhook
    return res.status(200).json({
      received: true,
      event_type: event.type,
    });

  } catch (error: any) {
    console.error("[Stripe Connect Webhook] Error fetching full event data:", error);
    return res.status(500).json({
      message: "Failed to fetch event data",
      error: error.message,
    });
  }
};

/**
 * Handle account updated event
 *
 * This event is sent when the account details or requirements change.
 * We should update our local record and notify the vendor if needed.
 */
async function handleAccountUpdated(
  event: Stripe.Event,
  stripeClient: Stripe,
  stripeConnectService: StripeConnectService
) {
  // Extract the account data from the event
  const accountData = event.data.object as Stripe.Account;
  const accountId = accountData.id;

  if (!accountId) {
    console.error("[Stripe Connect Webhook] Event missing account ID");
    return;
  }

  console.log(`[Stripe Connect Webhook] Account updated for: ${accountId}`);

  // Fetch the account from Stripe to get current status
  const account = await stripeClient.accounts.retrieve(accountId);

  // Find the local account record
  const localAccount = await stripeConnectService.findAccountByStripeId(accountId);

  if (localAccount) {
    // Update local account status
    const hasPendingRequirements =
      (account.requirements?.currently_due?.length ?? 0) > 0 ||
      (account.requirements?.past_due?.length ?? 0) > 0;
    const onboardingComplete = !hasPendingRequirements;

    const readyToReceivePayments = account?.capabilities?.transfers === "active";

    // Update the account in our database
    await stripeConnectService.updateStripeAccounts({
      id: localAccount.id,
      onboarding_complete: onboardingComplete,
      ready_to_receive_payments: readyToReceivePayments,
    });

    console.log(`[Stripe Connect Webhook] Updated account ${accountId}:`, {
      onboardingComplete,
      readyToReceivePayments,
    });

    // Here you could also send notifications to the vendor if:
    // - New requirements are due
    // - Onboarding is complete
    // - Payments are ready to be received
  } else {
    console.warn(`[Stripe Connect Webhook] Account ${accountId} not found in local database`);
  }
}

/**
 * Handle capability updated event
 *
 * This event is sent when a capability status changes.
 * For example, when the transfers capability becomes active.
 */
async function handleCapabilityUpdated(
  event: Stripe.Event,
  stripeClient: Stripe,
  stripeConnectService: StripeConnectService
) {
  // Extract the capability data from the event
  const capabilityData = event.data.object as Stripe.Capability;
  const accountId = capabilityData.account;

  if (!accountId) {
    console.error("[Stripe Connect Webhook] Event missing account ID");
    return;
  }

  console.log(`[Stripe Connect Webhook] Capability updated for: ${accountId}`);

  // Fetch the account from Stripe to get current status
  const account = await stripeClient.accounts.retrieve(accountId as string);

  // Find the local account record
  const localAccount = await stripeConnectService.findAccountByStripeId(accountId as string);

  if (localAccount) {
    // Update local account status
    const readyToReceivePayments = account?.capabilities?.transfers === "active";

    await stripeConnectService.updateStripeAccounts({
      id: localAccount.id,
      ready_to_receive_payments: readyToReceivePayments,
    });

    console.log(`[Stripe Connect Webhook] Updated account ${accountId}:`, {
      readyToReceivePayments,
    });

    // Notify the vendor if they are now ready to receive payments
    if (readyToReceivePayments && !localAccount.ready_to_receive_payments) {
      console.log(`[Stripe Connect Webhook] Account ${accountId} is now ready to receive payments!`);
      // Here you could send an email or notification to the vendor
    }
  } else {
    console.warn(`[Stripe Connect Webhook] Account ${accountId} not found in local database`);
  }
}
