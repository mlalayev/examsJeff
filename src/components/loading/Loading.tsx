import React from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = "md", 
  variant = "spinner", 
  className = "" 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const renderSpinner = () => (
    <>
      <style>
        {`
          .loader-spinner {
            width: 50px;
            aspect-ratio: 1;
            border-radius: 50%;
            border: 8px solid #514b82;
            animation:
              l20-1 0.8s infinite linear alternate,
              l20-2 1.6s infinite linear;
          }
          .loader-spinner.sm {
            width: 24px;
            border-width: 4px;
          }
          .loader-spinner.lg {
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
      <div className={`loader-spinner ${size} ${className}`}></div>
    </>
  );

  const renderDots = () => (
    <div className={`flex space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-bounce`} style={{animationDelay: '0ms'}}></div>
      <div className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-bounce`} style={{animationDelay: '150ms'}}></div>
      <div className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-bounce`} style={{animationDelay: '300ms'}}></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-pulse ${className}`}></div>
  );

  switch (variant) {
    case "dots":
      return renderDots();
    case "pulse":
      return renderPulse();
    default:
      return renderSpinner();
  }
};

export default Loading;
