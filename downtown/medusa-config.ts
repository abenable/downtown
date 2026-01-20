import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as
      | "shared"
      | "worker"
      | "server",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    // Production Redis modules
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          redisUrl: process.env.REDIS_URL,
        },
      },
    },
    // Payment providers
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // Stripe for card payments (international)
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
          // Flutterwave for Mobile Money (Uganda - MTN MoMo, Airtel Money)
          {
            resolve: "./src/modules/flutterwave-payment",
            id: "flutterwave",
            options: {
              secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
              publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
              webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    // File provider (S3/R2)
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_PUBLIC_URL,
              access_key_id: process.env.AWS_ACCESS_KEY_ID,
              secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
              region: "auto",
              bucket: process.env.S3_BUCKET_NAME,
              endpoint: process.env.S3_ENDPOINT,
            },
          },
        ],
      },
    },
    // Custom modules
    {
      resolve: "./src/modules/marketplace",
    },
    {
      resolve: "./src/modules/payout",
    },
    {
      resolve: "./src/modules/support",
    },
    {
      resolve: "./src/modules/product-review",
    },
    {
      resolve: "./src/modules/wishlist",
    },
    // Search module (Meilisearch)
    {
      resolve: "./src/modules/search",
      options: {
        host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
        apiKey: process.env.MEILISEARCH_API_KEY,
      },
    },
    // Refund module
    {
      resolve: "./src/modules/refund",
    },
    // Fulfillment provider for Downtown shipping
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "./src/modules/downtown-fulfillment",
            id: "downtown-fulfillment",
          },
        ],
      },
    },
    // Tax provider for platform fees
    {
      resolve: "@medusajs/medusa/tax",
      options: {
        providers: [
          {
            resolve: "./src/modules/platform-tax",
            id: "platform-fee",
            options: {
              rate: 10, // 10% platform fee
            },
          },
        ],
      },
    },
    // Notification providers
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          // Local provider for non-email channels (feed, etc.)
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              name: "Local Notification Provider",
              channels: ["feed"],
            },
          },
          // Email provider (Resend)
          {
            resolve: "./src/modules/email-notification",
            id: "email",
            options: {
              channels: ["email"],
              from: process.env.EMAIL_FROM || "noreply@campusdowntown.com",
              resendApiKey: process.env.RESEND_API_KEY,
            },
          },
          // SMS provider (Africa's Talking)
          {
            resolve: "./src/modules/sms-notification",
            id: "sms",
            options: {
              channels: ["sms"],
              apiKey: process.env.AFRICASTALKING_API_KEY,
              username: process.env.AFRICASTALKING_USERNAME,
              senderId: process.env.AFRICASTALKING_SENDER_ID || "Downtown",
            },
          },
        ],
      },
    },
  ],
});
