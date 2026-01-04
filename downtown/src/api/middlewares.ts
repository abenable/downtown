import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import multer from "multer";
import {
  PostVendorCreateSchema,
  PostVendorProductSchema,
  PostSupportTicketSchema,
} from "./vendors/validators";

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
        upload.array("files", 5),
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
  ],
});
