import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Badge,
  Button,
  Text,
  useToggleState,
} from "@medusajs/ui";
import { useEffect, useState } from "react";

type Vendor = {
  id: string;
  handle: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  admins: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }>;
};

const VendorApplicationsWidget = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : "";
      const response = await fetch(`/admin/vendors${params}`, {
        credentials: "include",
      });
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const approveVendor = async (vendorId: string) => {
    setActionLoading(vendorId);
    try {
      const response = await fetch(`/admin/vendors/${vendorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "approved" }),
      });
      if (response.ok) {
        fetchVendors();
      }
    } catch (error) {
      console.error("Failed to approve vendor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectVendor = async (vendorId: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    setActionLoading(vendorId);
    try {
      const response = await fetch(`/admin/vendors/${vendorId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rejection_reason: reason || "Application rejected",
        }),
      });
      if (response.ok) {
        fetchVendors();
      }
    } catch (error) {
      console.error("Failed to reject vendor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge color="orange">Pending</Badge>;
      case "approved":
        return <Badge color="green">Approved</Badge>;
      case "rejected":
        return <Badge color="red">Rejected</Badge>;
      default:
        return <Badge color="grey">{status}</Badge>;
    }
  };

  return (
    <Container className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">Vendor Applications</Heading>
        <div className="flex gap-2">
          <Button
            variant={filter === "pending" ? "primary" : "secondary"}
            size="small"
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "approved" ? "primary" : "secondary"}
            size="small"
            onClick={() => setFilter("approved")}
          >
            Approved
          </Button>
          <Button
            variant={filter === "rejected" ? "primary" : "secondary"}
            size="small"
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </Button>
          <Button
            variant={filter === "" ? "primary" : "secondary"}
            size="small"
            onClick={() => setFilter("")}
          >
            All
          </Button>
        </div>
      </div>

      {loading ? (
        <Text className="text-ui-fg-muted">Loading...</Text>
      ) : vendors.length === 0 ? (
        <Text className="text-ui-fg-muted">No vendor applications found.</Text>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-ui-border-base rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Text className="font-semibold text-lg">{vendor.name}</Text>
                    {getStatusBadge(vendor.status)}
                  </div>
                  <Text className="text-ui-fg-muted text-sm mb-1">
                    Handle: @{vendor.handle}
                  </Text>
                  <Text className="text-ui-fg-muted text-sm mb-1">
                    Email: {vendor.email}
                  </Text>
                  {vendor.phone && (
                    <Text className="text-ui-fg-muted text-sm mb-1">
                      Phone: {vendor.phone}
                    </Text>
                  )}
                  {vendor.description && (
                    <Text className="text-ui-fg-muted text-sm mb-2">
                      {vendor.description}
                    </Text>
                  )}
                  {vendor.admins && vendor.admins.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-ui-border-base">
                      <Text className="text-sm font-medium mb-1">
                        Admin Contact:
                      </Text>
                      {vendor.admins.map((admin) => (
                        <Text
                          key={admin.id}
                          className="text-ui-fg-muted text-sm"
                        >
                          {admin.first_name} {admin.last_name} ({admin.email})
                        </Text>
                      ))}
                    </div>
                  )}
                  {vendor.rejection_reason && (
                    <div className="mt-2 p-2 bg-ui-bg-subtle rounded">
                      <Text className="text-sm text-ui-fg-error">
                        Rejection Reason: {vendor.rejection_reason}
                      </Text>
                    </div>
                  )}
                  <Text className="text-ui-fg-muted text-xs mt-2">
                    Applied: {new Date(vendor.created_at).toLocaleDateString()}
                  </Text>
                </div>

                {vendor.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => approveVendor(vendor.id)}
                      isLoading={actionLoading === vendor.id}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => rejectVendor(vendor.id)}
                      isLoading={actionLoading === vendor.id}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.list.before",
});

export default VendorApplicationsWidget;
