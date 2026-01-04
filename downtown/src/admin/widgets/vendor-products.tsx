import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Badge, Text, Table, Button } from "@medusajs/ui";
import { useEffect, useState } from "react";

type VendorProduct = {
  id: string;
  title: string;
  status: string;
  thumbnail: string | null;
  created_at: string;
  variants?: Array<{
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
};

type Vendor = {
  id: string;
  name: string;
  handle: string;
  status: string;
  products: VendorProduct[];
};

const VendorProductsWidget = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  const fetchVendorsWithProducts = async () => {
    setLoading(true);
    try {
      // Fetch all approved vendors
      const vendorsResponse = await fetch(`/admin/vendors?status=approved`, {
        credentials: "include",
      });
      const vendorsData = await vendorsResponse.json();

      // For each vendor, fetch their products
      const vendorsWithProducts = await Promise.all(
        (vendorsData.vendors || []).map(async (vendor: any) => {
          try {
            const productsResponse = await fetch(
              `/admin/vendors/${vendor.id}/products`,
              { credentials: "include" }
            );
            const productsData = await productsResponse.json();
            return {
              ...vendor,
              products: productsData.products || [],
            };
          } catch (error) {
            return { ...vendor, products: [] };
          }
        })
      );

      setVendors(vendorsWithProducts);
    } catch (error) {
      console.error("Failed to fetch vendors with products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsWithProducts();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge color="green">Published</Badge>;
      case "draft":
        return <Badge color="orange">Draft</Badge>;
      default:
        return <Badge color="grey">{status}</Badge>;
    }
  };

  const formatPrice = (product: VendorProduct) => {
    if (product.variants?.[0]?.prices?.[0]) {
      const price = product.variants[0].prices[0];
      return `${price.currency_code.toUpperCase()} ${(
        price.amount / 100
      ).toLocaleString()}`;
    }
    return "-";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Container className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">Products by Vendor</Heading>
        <Button
          variant="secondary"
          size="small"
          onClick={fetchVendorsWithProducts}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <Text className="text-ui-fg-muted">Loading...</Text>
      ) : vendors.length === 0 ? (
        <Text className="text-ui-fg-muted">No approved vendors found.</Text>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-ui-border-base rounded-lg overflow-hidden"
            >
              {/* Vendor Header */}
              <div
                className="flex items-center justify-between p-4 bg-ui-bg-subtle cursor-pointer hover:bg-ui-bg-subtle-hover"
                onClick={() =>
                  setExpandedVendor(
                    expandedVendor === vendor.id ? null : vendor.id
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ui-bg-base rounded-full flex items-center justify-center">
                    <Text className="text-ui-fg-subtle font-medium">
                      {vendor.name.charAt(0).toUpperCase()}
                    </Text>
                  </div>
                  <div>
                    <Text className="font-medium">{vendor.name}</Text>
                    <Text className="text-ui-fg-subtle text-sm">
                      @{vendor.handle}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge color="purple">
                    {vendor.products.length} products
                  </Badge>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedVendor === vendor.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Products Table */}
              {expandedVendor === vendor.id && (
                <div className="border-t border-ui-border-base">
                  {vendor.products.length === 0 ? (
                    <div className="p-4">
                      <Text className="text-ui-fg-muted">
                        This vendor has no products yet.
                      </Text>
                    </div>
                  ) : (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Product</Table.HeaderCell>
                          <Table.HeaderCell>Status</Table.HeaderCell>
                          <Table.HeaderCell>Price</Table.HeaderCell>
                          <Table.HeaderCell>Created</Table.HeaderCell>
                          <Table.HeaderCell></Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {vendor.products.map((product) => (
                          <Table.Row key={product.id}>
                            <Table.Cell>
                              <div className="flex items-center gap-3">
                                {product.thumbnail ? (
                                  <img
                                    src={product.thumbnail}
                                    alt={product.title}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-ui-bg-subtle rounded flex items-center justify-center">
                                    <svg
                                      className="w-5 h-5 text-ui-fg-muted"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                                <Text className="font-medium">
                                  {product.title}
                                </Text>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              {getStatusBadge(product.status)}
                            </Table.Cell>
                            <Table.Cell>{formatPrice(product)}</Table.Cell>
                            <Table.Cell>
                              <Text className="text-ui-fg-subtle">
                                {formatDate(product.created_at)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <a
                                href={`/app/products/${product.id}`}
                                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                              >
                                View →
                              </a>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.list.before",
});

export default VendorProductsWidget;
