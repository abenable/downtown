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
          {
            resolve: "./src/modules/iotec-pay",
            id: "iotec",
            options: {
              apiBaseUrl: process.env.IOTEC_PAY_API_BASE_URL || "https://pay.iotec.io",
              tokenUrl: process.env.IOTEC_PAY_TOKEN_URL || "https://id.iotec.io/connect/token",
              walletId: process.env.IOTEC_PAY_WALLET_ID,
              clientId: process.env.IOTEC_PAY_CLIENT_ID,
              clientSecret: process.env.IOTEC_PAY_CLIENT_SECRET,
              callbackUrl: process.env.IOTEC_PAY_CALLBACK_URL,
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
    // Pickup location module
    {
      resolve: "./src/modules/pickup-location",
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
          // SMS provider (UG-SMS)
          {
            resolve: "./src/modules/sms-notification",
            id: "sms",
            options: {
              channels: ["sms"],
              apiKey: process.env.UGSMS_API_KEY,
              senderId: process.env.UGSMS_SENDER_ID || "Downtown",
              messageType: process.env.UGSMS_MESSAGE_TYPE || "transactional",
            },
          },
        ],
      },
    },
  ],
});
