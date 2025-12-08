"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-900 leading-none">404</h1>
          <div className="mt-4 h-1 w-24 bg-gray-900 mx-auto"></div>
        </div>

        {/* Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you are looking for does not exist or has been removed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-md transition w-full sm:w-auto"
            style={{ backgroundColor: "#303380" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#303380";
            }}
          >
            <Home className="w-4 h-4" />
            Home Page
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this error persists, please return to the{" "}
            <Link href="/" className="text-gray-900 hover:underline font-medium">
              home page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

