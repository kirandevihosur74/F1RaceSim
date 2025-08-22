import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scenario } = body
    
    // Call the backend strategy recommendation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') + '/strategy-recommendation'
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
    
    const data = await response.json()
    
    // Preserve the status code from the backend
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get strategy recommendation' },
      { status: 500 }
    )
  }
} 