import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeCoordinatesToString } from '@/lib/geometry-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { geometry } = body

    if (!geometry) {
      return NextResponse.json({ error: 'Geometry is required' }, { status: 400 })
    }

    // Generate normalized coordinate string from the clicked geometry
    const clickedCoordinateHash = normalizeCoordinatesToString(geometry);
    
    if (!clickedCoordinateHash) {
      return NextResponse.json({ error: 'Invalid geometry' }, { status: 400 })
    }

    // Fetch all commercial houses
    const commercialHouses = await prisma.commercialHouse.findMany()

    // Find matching commercial house by coordinate hash
    const matchingHouse = commercialHouses.find(house => {
      if (!house.geometry) return false
      
      // If coordinateHash is stored, use it for fast lookup
      if (house.coordinateHash) {
        return house.coordinateHash === clickedCoordinateHash;
      }
      
      // Fallback: generate hash from stored geometry
      const houseCoordinateHash = normalizeCoordinatesToString(house.geometry);
      return houseCoordinateHash === clickedCoordinateHash;
    })

    if (!matchingHouse) {
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

