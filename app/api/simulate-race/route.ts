import { NextRequest, NextResponse } from 'next/server'
import { validateApiAccess, incrementUsage, logSecurityEvent, logUserAction } from '../../../lib/planSecurity'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-west-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.error('AWS credentials missing in simulation API')
    throw new Error('AWS credentials not configured for simulation storage')
  }

  return new DynamoDBClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

let docClient: DynamoDBDocumentClient | null = null

const getDocClient = () => {
  if (!docClient) {
    const client = createDynamoDBClient()
    docClient = DynamoDBDocumentClient.from(client)
  }
  return docClient
}

// Use the dedicated simulation results table
const SIMULATION_RESULTS_TABLE = process.env.SIMULATION_RESULTS_TABLE || 'f1-simulation-results'

export async function POST(request: NextRequest) {
  try {
    // Validate plan access and rate limiting
    const accessValidation = await validateApiAccess(request, 'simulations', true)
    
    if (!accessValidation.allowed) {
      // Log security event for monitoring
      if (accessValidation.userId) {
        await logSecurityEvent(accessValidation.userId, 'SIMULATION_ACCESS_DENIED', {
          reason: accessValidation.message,
          planId: accessValidation.planId,
          timestamp: new Date().toISOString()
        })
      }
      
      return NextResponse.json({ 
        error: accessValidation.message || 'Access denied',
        planId: accessValidation.planId,
        upgradeRequired: accessValidation.statusCode === 403
      }, { status: accessValidation.statusCode || 403 })
    }

    const userId = accessValidation.userId!
    const planId = accessValidation.planId!
    
    const body = await request.json()
    
    console.log('Simulation request validated for user:', userId, 'plan:', planId)
    
    // Increment usage after successful validation
    try {
      await incrementUsage(userId, 'simulations')
      console.log('Usage incremented for user:', userId)
    } catch (error) {
      console.error('Error incrementing usage:', error)
      // Continue with simulation even if usage tracking fails
    }

    // Forward the request to your backend simulation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') + '/simulate-race'
    
    console.log('Backend URL:', backendUrl)
    console.log('Request body:', body)
    
    // Check if backend URL is valid
    if (!backendUrl || backendUrl.includes('your-backend-url.com') || backendUrl.includes('your-api-gateway-url')) {
      console.error('Invalid backend URL:', backendUrl)
      return NextResponse.json({ 
        error: 'Backend not configured',
        details: `NEXT_PUBLIC_API_URL is not set correctly. Current value: ${process.env.NEXT_PUBLIC_API_URL || 'NOT_SET'}. Please configure your backend URL.`
      }, { status: 500 })
    }
    
    const simResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    console.log('Backend response status:', simResponse.status)
    console.log('Backend response headers:', Object.fromEntries(simResponse.headers.entries()))
    
    if (!simResponse.ok) {
      const errorData = await simResponse.json()
      console.log('Backend error response:', errorData)
      return NextResponse.json(errorData, { status: simResponse.status })
    }
    
    const data = await simResponse.json()
    
    console.log('Backend simulation response:', JSON.stringify(data, null, 2))
    console.log('Simulation completed, usage incremented for user:', userId)
    
    // Store simulation results in dedicated table
    try {
      const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()
      
      const simulationResult = {
        simulation_id: simulationId,
        user_id: userId,
        track_id: body.track_id || 'unknown',
        strategy_data: body.strategy || {},
        weather: body.weather || 'dry',
        simulation_type: body.simulation_type || 'single_car',
        results: data.simulation || [], // Fixed: backend returns 'simulation' not 'results'
        total_time: data.total_time || null,
        strategy_analysis: data.strategy_analysis || null,
        created_at: now,
        updated_at: now
      }
      
      const putCommand = new PutCommand({
        TableName: SIMULATION_RESULTS_TABLE,
        Item: simulationResult
      })
      
      await getDocClient().send(putCommand)
      console.log('Simulation results stored in database:', simulationId)
      
      // Log successful simulation action
      await logUserAction(userId, 'SIMULATION_COMPLETED', {
        simulation_id: simulationId,
        track_id: body.track_id,
        strategy_name: body.strategy?.name,
        weather: body.weather,
        total_time: data.total_time
      })
    } catch (error) {
      console.error('Error storing simulation results:', error)
      // Continue even if storage fails
    }
    
    // Get updated usage information
    const { getCurrentUsage, getFeatureLimit } = await import('../../../lib/planSecurity')
    const currentUsage = await getCurrentUsage(userId, 'simulations')
    const limit = getFeatureLimit(planId, 'simulations')
    
    return NextResponse.json({
      ...data,
      usage: {
        current: currentUsage,
        limit: limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage)
      }
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
} 