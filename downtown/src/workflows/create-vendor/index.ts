import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows";
import { createVendorStep } from "./steps/create-vendor";
import { createVendorAdminStep } from "./steps/create-vendor-admin";

type CreateVendorWorkflowInput = {
  vendor: {
    handle: string;
    name: string;
    logo?: string;
    description?: string;
    phone?: string;
    email?: string;
  };
  admin: {
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    customer_id?: string; // Link to customer account
  };
  auth_identity_id: string;
};

export const createVendorWorkflow = createWorkflow(
  "create-vendor-workflow",
  (input: CreateVendorWorkflowInput) => {
    const vendor = createVendorStep(input.vendor);

    // Transform to extract vendor_id from the step result
    const vendorAdminInput = transform(
      { vendor, admin: input.admin },
      (data) => ({
        vendor_id: data.vendor.id,
        ...data.admin,
      })
    );

    const vendorAdmin = createVendorAdminStep(vendorAdminInput);

    // Only set vendor actor metadata if not coming from customer auth
    // Customer auth users access vendor via customer_id link
    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "vendor",
      value: vendorAdmin.id,
    });

    return new WorkflowResponse({
      vendor,
      vendorAdmin,
    });
  }
);
