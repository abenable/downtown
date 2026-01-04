import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as path from "path";

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "abenable-r2";

// POST /vendors/uploads - Upload a file to R2/S3 for vendor products
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Check if we have file data
    const files = (req as any).files;

    if (!files || !files.length) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const file = files[0];

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    const filename = `vendors/${timestamp}-${randomString}${extension}`;

    // Determine content type
    const contentType = file.mimetype || "image/jpeg";

    // Upload to R2/S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: file.buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Construct the public URL using custom domain
    const publicUrl = process.env.S3_PUBLIC_URL || "https://r2.abenable.tech";
    const url = `${publicUrl}/${filename}`;

    res.json({
      success: true,
      url,
      filename,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload file",
    });
  }
};
