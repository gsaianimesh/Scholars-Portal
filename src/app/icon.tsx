import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#6d28d9"/>
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif" fontSize="20" fontWeight="bold">R</text>
      </svg>
    ),
    { ...size }
  )
}
