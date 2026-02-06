"use client";

import React from "react";

export const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pt-3 pb-3">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Skeleton */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="rounded-xl shadow-sm border p-4 bg-white border-gray-200">
              {/* Exam Info Skeleton */}
              <div className="mb-4">
                <div className="h-5 bg-gray-400 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-400 rounded w-24 mb-3 animate-pulse"></div>
                <div className="h-2 bg-gray-400 rounded w-full mb-1 animate-pulse"></div>
                <div className="h-2 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </div>

              {/* Sections List Skeleton */}
              <div className="space-y-2 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-400 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-400 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Submit Button Skeleton */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="h-12 bg-gray-400 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Questions Area Skeleton */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Title Skeleton */}
              <div className="mb-6">
                <div className="h-8 bg-gray-400 rounded w-48 animate-pulse"></div>
              </div>

              {/* Questions Skeleton */}
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-400 rounded-lg animate-pulse"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-400 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-400 rounded w-5/6 animate-pulse"></div>
                        <div className="h-20 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

