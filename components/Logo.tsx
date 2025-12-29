
import React from 'react';

export const Logo: React.FC<{ size?: number, className?: string }> = ({ size = 40, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Blocks */}
      <path 
        d="M10 25H42L50 40L58 25H90V45H10V25Z" 
        fill="currentColor" 
      />
      {/* Bottom U-Shape */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M10 55C10 77.0914 27.9086 95 50 95C72.0914 95 90 77.0914 90 55V50H80V55C80 71.5685 66.5685 85 50 85C33.4315 85 20 71.5685 20 55V50H10V55Z" 
        fill="currentColor" 
      />
    </svg>
  );
};
