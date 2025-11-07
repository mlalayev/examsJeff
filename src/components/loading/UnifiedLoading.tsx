import React from "react";

interface UnifiedLoadingProps {
  type?: "spinner" | "skeleton" | "fullpage";
  variant?: "spinner" | "dots" | "pulse" | "card" | "table" | "list" | "text" | "button" | "navbar";
  size?: "sm" | "md" | "lg";
  count?: number;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const UnifiedLoading: React.FC<UnifiedLoadingProps> = ({
  type = "spinner",
  variant = "spinner",
  size = "md",
  count = 1,
  text,
  className = "",
  fullScreen = false,
}) => {
  // Spinner variants
  const renderSpinner = () => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    };

    switch (variant) {
      case "dots":
        return (
          <div className={`flex space-x-2 ${className}`}>
            <div
              className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-bounce`}
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-bounce`}
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-bounce`}
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        );

      case "pulse":
        return (
          <div
            className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-pulse ${className}`}
          ></div>
        );

      default: // spinner
        return (
          <>
            <style>
              {`
                .unified-loader-spinner {
                  width: 50px;
                  aspect-ratio: 1;
                  border-radius: 50%;
                  border: 8px solid #514b82;
                  animation:
                    l20-1 0.8s infinite linear alternate,
                    l20-2 1.6s infinite linear;
                }
                .unified-loader-spinner.sm {
                  width: 24px;
                  border-width: 4px;
                }
                .unified-loader-spinner.lg {
                  width: 64px;
                  border-width: 12px;
                }
                @keyframes l20-1{
                  0%    {clip-path: polygon(50% 50%,0       0,  50%   0%,  50%    0%, 50%    0%, 50%    0%, 50%    0% )}
                  12.5% {clip-path: polygon(50% 50%,0       0,  50%   0%,  100%   0%, 100%   0%, 100%   0%, 100%   0% )}
                  25%   {clip-path: polygon(50% 50%,0       0,  50%   0%,  100%   0%, 100% 100%, 100% 100%, 100% 100% )}
                  50%   {clip-path: polygon(50% 50%,0       0,  50%   0%,  100%   0%, 100% 100%, 50%  100%, 0%   100% )}
                  62.5% {clip-path: polygon(50% 50%,100%    0, 100%   0%,  100%   0%, 100% 100%, 50%  100%, 0%   100% )}
                  75%   {clip-path: polygon(50% 50%,100% 100%, 100% 100%,  100% 100%, 100% 100%, 50%  100%, 0%   100% )}
                  100%  {clip-path: polygon(50% 50%,50%  100%,  50% 100%,   50% 100%,  50% 100%, 50%  100%, 0%   100% )}
                }
                @keyframes l20-2{ 
                  0%    {transform:scaleY(1)  rotate(0deg)}
                  49.99%{transform:scaleY(1)  rotate(135deg)}
                  50%   {transform:scaleY(-1) rotate(0deg)}
                  100%  {transform:scaleY(-1) rotate(-135deg)}
                }
              `}
            </style>
            <div className={`unified-loader-spinner ${size} ${className}`}></div>
          </>
        );
    }
  };

  // Skeleton variants
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        );

      case "table":
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "list":
        return (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        );

      case "text":
        return (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        );

      case "button":
        return (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
          </div>
        );

      case "navbar":
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="w-32 h-6 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        );
    }
  };

  // Main render logic
  if (type === "skeleton") {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  if (type === "fullpage") {
    const spinnerSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
    return (
      <div className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[400px]"} ${className}`}>
        <div className="text-center">
          {variant === "spinner" ? (
            <div className={`animate-spin rounded-full ${spinnerSize} border-b-2 border-blue-600 mx-auto`}></div>
          ) : (
            renderSpinner()
          )}
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  // Default: inline spinner
  if (text) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          {variant === "spinner" ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          ) : (
            <div className="flex justify-center">{renderSpinner()}</div>
          )}
          <p className="mt-2 text-gray-600">{text}</p>
        </div>
      </div>
    );
  }

  return renderSpinner();
};

export default UnifiedLoading;

