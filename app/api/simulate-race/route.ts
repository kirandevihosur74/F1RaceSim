import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Forward the request to your backend simulation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') + '/simulate-race'
    const simResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await simResponse.json()
    
    // Preserve the status code from the backend
    return NextResponse.json(data, { status: simResponse.status })
  } catch (error) {
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
} 