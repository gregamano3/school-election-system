"use client";

import { useState } from "react";

export function CandidateImage({ 
  src, 
  alt, 
  className = "",
  size = "md"
}: { 
  src: string; 
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [hasError, setHasError] = useState(false);
  
  const sizeClasses = {
    sm: "h-14 w-14",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };
  
  if (hasError) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-[#e8ecf1] dark:bg-[#2d394a] ${className}`}>
        <span className="material-symbols-outlined text-2xl text-[#617289] dark:text-[#a1b0c3]">
          person
        </span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border border-[#dbe0e6] dark:border-[#2d394a] ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
