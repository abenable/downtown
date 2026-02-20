import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import multer from "multer";

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
) => {
  return (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader("Retry-After", String(Math.ceil((record.resetTime - now) / 1000)));
      res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
      return;
    }

    record.count++;
    return next();
  };
};

// Input sanitization middleware
const sanitizeInput = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sanitizeString = (str: unknown): unknown => {
    if (typeof str !== "string") return str;
    // Remove potential XSS vectors
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/data:/gi, "data-blocked:");
  };

  const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj !== "object" || obj === null) return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  };

  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body) as Record<string, unknown>;
  }

  next();
};

// Admin authorization verification middleware
const verifyAdminAuth = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  // This will be applied after authenticate middleware
  // to ensure admin routes require proper authentication
  const authContext = (req as any).auth_context;

  if (!authContext || authContext.actor_type !== "user") {
    res.status(403).json({
      message: "Admin authorization required",
    });
    return;
  }

  next();
};
import {
  PostVendorCreateSchema,
  PostVendorProductSchema,
  PostSupportTicketSchema,
} from "./vendors/validators";
import { PostStoreReviewSchema } from "./store/reviews/route";
import { GetAdminReviewsSchema } from "./admin/reviews/route";
import { GetStoreReviewsSchema } from "./store/products/[id]/reviews/route";
import { PostStoreCreateWishlistItem } from "./store/customers/me/wishlists/items/validators";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Wrap multer middleware to be compatible with Medusa's middleware types
const multerUpload = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  upload.array("files", 5)(req as any, res as any, next);
};

// CORS middleware for uploads
const uploadCors = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const allowedOrigins = (
    process.env.STORE_CORS || "http://localhost:8000"
  ).split(",");
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
};

export default defineMiddlewares({
  routes: [
    // Skip authentication for clear-stripe-customers endpoint
    {
      matcher: "/store/clear-stripe-customers",
      middlewares: [],
    },
    // Global rate limiting - apply to all routes
    {
      matcher: "/store/*",
      middlewares: [rateLimit(100, 60000)], // 100 requests per minute
    },
    {
      matcher: "/vendors/*",
      middlewares: [rateLimit(60, 60000)], // 60 requests per minute for vendor APIs
    },
    {
      matcher: "/admin/*",
      middlewares: [rateLimit(120, 60000)], // 120 requests per minute for admin
    },
    // Global input sanitization for POST/PUT/PATCH
    {
      matcher: "/store/*",
      method: ["POST", "PUT", "PATCH"],
      middlewares: [sanitizeInput],
    },
    {
      matcher: "/vendors/*",
      method: ["POST", "PUT", "PATCH"],
      middlewares: [sanitizeInput],
    },
    // Webhook rate limiting (stricter)
    {
      matcher: "/webhooks/*",
      middlewares: [rateLimit(30, 60000)], // 30 requests per minute
    },
    // Admin routes - verify admin authorization
    {
      matcher: "/admin/vendors/*",
      middlewares: [authenticate("user", ["session", "bearer"]), verifyAdminAuth],
    },
    {
      matcher: "/admin/payouts/*",
      middlewares: [authenticate("user", ["session", "bearer"]), verifyAdminAuth],
    },
    {
      matcher: "/admin/refunds/*",
      middlewares: [authenticate("user", ["session", "bearer"]), verifyAdminAuth],
    },
    // New vendor routes
    {
      matcher: "/vendors/payment-settings",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/payouts/request",
      method: ["POST"],
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    // Store refund routes
    {
      matcher: "/store/orders/*/refund",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    // File upload route - CORS + auth + multer
    {
      matcher: "/vendors/uploads",
      method: ["POST", "OPTIONS"],
      middlewares: [uploadCors],
    },
    {
      matcher: "/vendors/uploads",
      method: ["POST"],
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
        multerUpload,
      ],
    },
    // Vendor registration - allow customer auth to become vendor
    {
      matcher: "/vendors",
      method: ["POST"],
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"], {
          allowUnregistered: true,
        }),
        validateAndTransformBody(PostVendorCreateSchema),
      ],
    },
    // All other vendor routes - accept both customer and vendor auth
    {
      matcher: "/vendors/me",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/products",
      method: ["GET"],
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/products",
      method: ["POST"],
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
        validateAndTransformBody(PostVendorProductSchema),
      ],
    },
    {
      matcher: "/vendors/products/*",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/orders",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/orders/*",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/payouts",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/analytics",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/support",
      method: ["GET"],
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    {
      matcher: "/vendors/support",
      method: ["POST"],
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
        validateAndTransformBody(PostSupportTicketSchema),
      ],
    },
    {
      matcher: "/vendors/support/*",
      middlewares: [
        authenticate(["customer", "vendor"], ["session", "bearer"]),
      ],
    },
    // Saved payment methods - customer auth only
    {
      matcher: "/store/payment-methods/:account_holder_id",
      method: "GET",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    // Product reviews - store routes
    {
      method: ["POST"],
      matcher: "/store/reviews",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreReviewSchema),
      ],
    },
    {
      matcher: "/store/products/:id/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetStoreReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "rating",
            "title",
            "first_name",
            "last_name",
            "content",
            "created_at",
          ],
        }),
      ],
    },
    // Product reviews - admin routes
    {
      matcher: "/admin/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "title",
            "content",
            "rating",
            "product_id",
            "customer_id",
            "created_at",
            "updated_at",
            "product.*",
          ],
        }),
      ],
    },
    // Wishlist routes - customer auth
    {
      matcher: "/store/customers/me/wishlists",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/customers/me/wishlists/items",
      method: ["POST"],
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreCreateWishlistItem),
      ],
    },
    {
      matcher: "/store/customers/me/wishlists/items/*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/customers/me/wishlists/share",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
});
