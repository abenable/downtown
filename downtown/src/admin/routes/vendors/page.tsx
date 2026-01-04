import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Badge, Button, Text, Table } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { BuildingStorefront } from "@medusajs/icons";

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
  approved_at: string | null;
  admins: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }>;
};

const VendorsPage = () => {
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
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Vendor Applications</Heading>
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

      <div className="px-6 py-4">
        {loading ? (
          <Text className="text-ui-fg-muted">Loading vendors...</Text>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <BuildingStorefront className="w-12 h-12 mx-auto text-ui-fg-muted mb-4" />
            <Text className="text-ui-fg-muted">
              No {filter || "vendor"} applications found.
            </Text>
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="border border-ui-border-base rounded-lg p-4 hover:bg-ui-bg-subtle transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-ui-bg-component rounded-full flex items-center justify-center">
                        <BuildingStorefront className="w-5 h-5 text-ui-fg-muted" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Text className="font-semibold">{vendor.name}</Text>
                          {getStatusBadge(vendor.status)}
                        </div>
                        <Text className="text-ui-fg-muted text-sm">
                          @{vendor.handle}
                        </Text>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Text className="text-ui-fg-muted">Email</Text>
                        <Text>{vendor.email || "—"}</Text>
                      </div>
                      <div>
                        <Text className="text-ui-fg-muted">Phone</Text>
                        <Text>{vendor.phone || "—"}</Text>
                      </div>
                    </div>

                    {vendor.description && (
                      <div className="mt-3">
                        <Text className="text-ui-fg-muted text-sm">
                          Description
                        </Text>
                        <Text className="text-sm">{vendor.description}</Text>
                      </div>
                    )}

                    {vendor.admins && vendor.admins.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-ui-border-base">
                        <Text className="text-ui-fg-muted text-sm mb-1">
                          Vendor Admin
                        </Text>
                        {vendor.admins.map((admin) => (
                          <div key={admin.id} className="text-sm">
                            <Text className="font-medium">
                              {admin.first_name} {admin.last_name}
                            </Text>
                            <Text className="text-ui-fg-muted">
                              {admin.email} {admin.phone && `• ${admin.phone}`}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}

                    {vendor.rejection_reason && (
                      <div className="mt-3 p-2 bg-ui-bg-subtle-error rounded">
                        <Text className="text-sm text-ui-fg-error">
                          <strong>Rejection Reason:</strong>{" "}
                          {vendor.rejection_reason}
                        </Text>
                      </div>
                    )}

                    <div className="mt-3 flex gap-4 text-xs text-ui-fg-muted">
                      <span>
                        Applied: {new Date(vendor.created_at).toLocaleString()}
                      </span>
                      {vendor.approved_at && (
                        <span>
                          Approved:{" "}
                          {new Date(vendor.approved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {vendor.status === "pending" && (
                    <div className="flex flex-col gap-2 ml-4">
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
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Vendors",
  icon: BuildingStorefront,
});

export default VendorsPage;
