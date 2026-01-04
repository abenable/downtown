import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="text-6xl font-light text-gray-200">404</div>
      <h1 className="text-xl font-medium text-gray-900">Page not found</h1>
      <p className="text-gray-500 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        className="mt-4 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-800 transition-colors"
        href="/"
      >
        Back to Home
      </Link>
    </div>
  )
}
