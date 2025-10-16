import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { geometry } = body

    if (!geometry) {
      return NextResponse.json({ error: 'Geometry is required' }, { status: 400 })
    }

    // Fetch all commercial houses
    const commercialHouses = await prisma.commercialHouse.findMany()

    // Find matching commercial house by geometry
    // We'll use a simple JSON string comparison for exact matches
    // For more complex geometry matching, you might want to use PostGIS
    const geometryString = JSON.stringify(geometry)
    
    const matchingHouse = commercialHouses.find(house => {
      if (!house.geometry) return false
      const houseGeometryString = JSON.stringify(house.geometry)
      return houseGeometryString === geometryString
    })

    if (!matchingHouse) {
      // Try to match by coordinates if exact geometry match fails
      // Extract coordinates from the clicked geometry
      const clickedCoords = extractCoordinatesFromGeometry(geometry)
      
      for (const house of commercialHouses) {
        if (!house.geometry) continue
        const houseCoords = extractCoordinatesFromGeometry(house.geometry)
        
        // Check if the coordinates overlap or are very close
        if (coordinatesMatch(clickedCoords, houseCoords)) {
          return NextResponse.json(house)
        }
      }
      
      return NextResponse.json({ error: 'No matching commercial house found' }, { status: 404 })
    }

    return NextResponse.json(matchingHouse)
  } catch (error) {
    console.error('Failed to fetch commercial house by geometry:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch commercial house', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Helper function to extract coordinates from geometry
function extractCoordinatesFromGeometry(geometry: any): number[][] {
  const coords: number[][] = []
  
  const extractRecursive = (coord: any) => {
    if (Array.isArray(coord)) {
      if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
        coords.push([coord[0], coord[1]])
      } else {
        coord.forEach(extractRecursive)
      }
    }
  }
  
  if (geometry && geometry.coordinates) {
    extractRecursive(geometry.coordinates)
  }
  
  return coords
}

// Helper function to check if coordinates match (within tolerance)
function coordinatesMatch(coords1: number[][], coords2: number[][], tolerance = 0.00001): boolean {
  if (coords1.length === 0 || coords2.length === 0) return false
  
  // Check if any coordinate from coords1 matches any coordinate from coords2
  for (const c1 of coords1) {
    for (const c2 of coords2) {
      const distance = Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2)
      )
      if (distance < tolerance) {
        return true
      }
    }
  }
  
  return false
}

