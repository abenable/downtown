import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Table } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { Star } from "@medusajs/icons";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";

type Review = {
  id: string;
  title: string;
  content: string;
  rating: number;
  first_name: string;
  last_name: string;
  product_id: string;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
};

const ProductReviewsWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/admin/reviews?filters[product_id]=${data.id}`,
        {
          credentials: "include",
        }
      );
      const result = await response.json();
      setReviews(result.reviews || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [data.id]);

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
      <div className="flex justify-between items-center mb-4">
        <Heading level="h2">Reviews ({reviews.length})</Heading>
      </div>

      {loading ? (
        <Text>Loading reviews...</Text>
      ) : reviews.length === 0 ? (
        <Text className="text-gray-500">No reviews for this product yet.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Review</Table.HeaderCell>
              <Table.HeaderCell>Rating</Table.HeaderCell>
              <Table.HeaderCell>Author</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
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
                <Table.Cell>
                  <Text className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductReviewsWidget;
