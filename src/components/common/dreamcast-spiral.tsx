"use client";

interface DreamcastSpiralProps {
  size?: number;
  color?: string;
  className?: string;
}

export function DreamcastSpiral({ size = 120, color = "#e8871e", className = "" }: DreamcastSpiralProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      fill="none"
    >
      {/* Official Dreamcast swirl logo */}
      <path
        d="
          M 118 8
          C 118 8, 160 10, 180 40
          C 200 70, 198 110, 180 140
          C 162 170, 130 182, 100 182
          C 70 182, 40 165, 24 140
          C 8 115, 10 80, 28 55
          C 46 30, 75 20, 100 20
          C 125 20, 148 35, 160 55
          C 172 75, 172 100, 160 120
          C 148 140, 125 150, 100 150
          C 78 150, 58 133, 48 115
          C 38 97, 42 75, 55 60
          C 68 45, 85 40, 100 40
          C 115 40, 128 48, 136 60
          C 144 72, 142 90, 134 102
          C 126 114, 113 120, 100 120
          C 88 120, 78 112, 72 102
          C 66 92, 68 80, 76 72
          C 84 64, 92 62, 100 62
          C 108 62, 114 66, 118 72
          C 122 78, 122 86, 118 92
          C 114 98, 108 100, 102 100
          C 96 100, 92 97, 90 93
          C 88 89, 89 85, 92 82
          C 95 79, 98 79, 100 80
        "
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
