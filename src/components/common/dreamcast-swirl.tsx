"use client";

interface DreamcastSwirlProps {
  className?: string;
  size?: number;
  animate?: boolean;
  color?: string;
}

export function DreamcastSwirl({ className = "", size = 32, animate = false, color }: DreamcastSwirlProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${animate ? "dc-swirl-spin" : ""} ${className}`}
      fill={color || "currentColor"}
    >
      <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90c-22.1 0-40-17.9-40-40S27.9 10 50 10c5.5 0 10.7 1.1 15.5 3.1C56.3 16.4 50 24.5 50 34c0 13.8 11.2 25 25 25 4.8 0 9.3-1.4 13.1-3.7C86.5 60.4 85 66.3 82 71.5 74.7 83.3 63 90 50 90z" />
    </svg>
  );
}
