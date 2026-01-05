import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Badge, Button, Text, Table } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { Star, Check, XMark } from "@medusajs/icons";

type Review = {
  id: string;
  title: string;
  content: string;
  rating: number;
  first_name: string;
  last_name: string;
  status: "pending" | "approved" | "rejected";
  product_id: string;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
};

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : "";
      const response = await fetch(`/admin/reviews${params}`, {
        credentials: "include",
      });
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const updateReviewStatus = async (
    reviewId: string,
    status: "approved" | "rejected"
  ) => {
    setActionLoading(reviewId);
    try {
      const response = await fetch(`/admin/reviews/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: [reviewId], status }),
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error(`Failed to ${status} review:`, error);
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <Heading level="h1">Product Reviews</Heading>
        <div className="flex gap-2">
          <Button
            variant={filter === "pending" ? "primary" : "secondary"}
            onClick={() => setFilter("pending")}
            size="small"
          >
            Pending
          </Button>
          <Button
            variant={filter === "approved" ? "primary" : "secondary"}
            onClick={() => setFilter("approved")}
            size="small"
          >
            Approved
          </Button>
          <Button
            variant={filter === "rejected" ? "primary" : "secondary"}
            onClick={() => setFilter("rejected")}
            size="small"
          >
            Rejected
          </Button>
          <Button
            variant={!filter ? "primary" : "secondary"}
            onClick={() => setFilter("")}
            size="small"
          >
            All
          </Button>
        </div>
      </div>

      {loading ? (
        <Text>Loading reviews...</Text>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <Text className="text-gray-500">
            No {filter || ""} reviews found.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Rating</Table.HeaderCell>
              <Table.HeaderCell>Author</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reviews.map((review) => (
              <Table.Row key={review.id}>
                <Table.Cell>
                  <div>
                    <Text className="font-medium">{review.title}</Text>
                    <Text className="text-sm text-gray-500 line-clamp-2">
                      {review.content}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>{renderStars(review.rating)}</Table.Cell>
                <Table.Cell>
                  <Text>
                    {review.first_name} {review.last_name}
                  </Text>
                </Table.Cell>
                <Table.Cell>{getStatusBadge(review.status)}</Table.Cell>
                <Table.Cell>
                  <Text className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    {review.status === "pending" && (
                      <>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() =>
                            updateReviewStatus(review.id, "approved")
                          }
                          disabled={actionLoading === review.id}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() =>
                            updateReviewStatus(review.id, "rejected")
                          }
                          disabled={actionLoading === review.id}
                        >
                          <XMark className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {review.status === "approved" && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          updateReviewStatus(review.id, "rejected")
                        }
                        disabled={actionLoading === review.id}
                      >
                        <XMark className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    )}
                    {review.status === "rejected" && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          updateReviewStatus(review.id, "approved")
                        }
                        disabled={actionLoading === review.id}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Reviews",
  icon: Star,
});

export default ReviewsPage;
