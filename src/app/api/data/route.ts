import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    "tiles": ["http://localhost:3000/api/tiles/{z}/{x}/{y}"],
    "minzoom": 0,
    "maxzoom": 14,
    "bounds": [-180, -85, 180, 85],
    "center": [107.4439, -6.5569, 10]
  });
} 