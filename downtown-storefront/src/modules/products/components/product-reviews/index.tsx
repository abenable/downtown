"use client"

import { useState, useTransition } from "react"
import { addProductReview } from "@lib/data/products"

type StoreProductReview = {
  id: string
  title: string
  content: string
  rating: number
  first_name: string
  last_name: string
  status: "pending" | "approved" | "rejected"
  product_id: string
  customer_id: string | null
  created_at: string
  updated_at: string
}

type ProductReviewsProps = {
  productId: string
  reviews: StoreProductReview[]
  averageRating: number | null
  count: number
}

const StarIcon = ({
  filled,
  size = "md",
}: {
  filled: boolean
  size?: "sm" | "md" | "lg"
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  return (
    <svg
      className={`${sizeClasses[size]} ${
        filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
      }`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

const StarRating = ({
  rating,
  size = "md",
}: {
  rating: number
  size?: "sm" | "md" | "lg"
}) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= rating} size={size} />
      ))}
    </div>
  )
}

const InteractiveStarRating = ({
  rating,
  onRatingChange,
}: {
  rating: number
  onRatingChange: (rating: number) => void
}) => {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <StarIcon filled={star <= (hoverRating || rating)} size="lg" />
        </button>
      ))}
    </div>
  )
}

const ReviewCard = ({ review }: { review: StoreProductReview }) => {
  return (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium text-sm">
              {review.first_name[0]}
              {review.last_name[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {review.first_name} {review.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      <p className="text-gray-600">{review.content}</p>
    </div>
  )
}

const ProductReviewsForm = ({
  productId,
  onReviewSubmitted,
}: {
  productId: string
  onReviewSubmitted: () => void
}) => {
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (
      !title.trim() ||
      !content.trim() ||
      !firstName.trim() ||
      !lastName.trim()
    ) {
      setError("Please fill in all fields")
      return
    }

    startTransition(async () => {
      try {
        await addProductReview({
          product_id: productId,
          title: title.trim(),
          content: content.trim(),
          rating,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })
        setSuccess(true)
        setRating(0)
        setTitle("")
        setContent("")
        setFirstName("")
        setLastName("")
        onReviewSubmitted()
      } catch (err) {
        setError("Failed to submit review. Please try again.")
        console.error("Error submitting review:", err)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          Thank you! Your review has been submitted and is pending approval.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating *
        </label>
        <InteractiveStarRating rating={rating} onRatingChange={setRating} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            required
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="Summarize your experience"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Review *
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="Share your experience with this product"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  )
}

const ProductReviews = ({
  productId,
  reviews: initialReviews,
  averageRating,
  count,
}: ProductReviewsProps) => {
  const [reviews, setReviews] = useState(initialReviews)
  const [showForm, setShowForm] = useState(false)

  const handleReviewSubmitted = () => {
    // In a real app, you might want to refetch reviews here
    // For now, we just keep the existing reviews and show the success message
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <div className="flex items-center gap-2 mt-2">
            {averageRating !== null ? (
              <>
                <StarRating rating={Math.round(averageRating)} />
                <span className="text-gray-600">
                  {averageRating.toFixed(1)} out of 5 ({count}{" "}
                  {count === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-gray-500">No reviews yet</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 border border-black rounded-md hover:bg-black hover:text-white transition-colors"
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ProductReviewsForm
            productId={productId}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No reviews yet. Be the first to review this product!
        </p>
      )}
    </div>
  )
}

export default ProductReviews
