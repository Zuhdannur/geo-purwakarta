import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  
  console.log(`Requested tile: z=${z}, x=${x}, y=${y}`);
  
  // For this demo, we'll return a simple response
  // In a real implementation, you would extract tiles from the mbtiles file
  return NextResponse.json({
    message: `Tile requested: z=${z}, x=${x}, y=${y}`,
    note: "This is a placeholder. In production, extract actual tiles from data.mbtiles"
  });
} 