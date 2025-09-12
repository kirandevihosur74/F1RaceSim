import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { isAdmin } from '../../../../lib/admin'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-west-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured')
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const planFilter = searchParams.get('plan') || 'all'
    const searchTerm = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'lastActive'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get real user data from DynamoDB metadata table
    let users: any[] = []
    const metadataTable = process.env.METADATA_TABLE || 'f1-strategy-metadata-dev'

    try {
      // Scan the metadata table to find user profiles
      console.log('Starting scan of metadata table:', metadataTable)
      
      const scanCommand = new ScanCommand({
        TableName: metadataTable
      })
      
      const scanResult = await getDocClient().send(scanCommand)
      const allItems = scanResult.Items || []
      
      console.log('Scan completed, processing items...')
      
      // Filter out any items with invalid keys that could cause pk.match errors
      const validItems = allItems.filter((item: any, index: number) => {
        try {
          // Ensure item has required properties
          if (!item || typeof item !== 'object') {
            console.warn(`Invalid item at index ${index}:`, item)
            return false
          }
          
          // Ensure strategy_id is valid
          if (!item.strategy_id || typeof item.strategy_id !== 'string') {
            console.warn(`Item at index ${index} with invalid strategy_id found:`, item)
            return false
          }
          
          // Ensure user_id is valid if present
          if (item.user_id && typeof item.user_id !== 'string') {
            console.warn(`Item at index ${index} with invalid user_id found:`, item)
            return false
          }
          
          return true
        } catch (filterError) {
          console.error(`Error filtering item at index ${index}:`, filterError, 'Item:', item)
          return false
        }
      })
      
      console.log(`Scanned ${allItems.length} items, found ${validItems.length} valid items`)
      
      // Filter for user profile items
      const userProfiles = validItems.filter((item: any) => 
        item.type === 'USER_PROFILE' || 
        (item.strategy_id?.startsWith('USER_') && item.strategy_id?.endsWith('_PROFILE'))
      )

      // Process each user profile
      users = await Promise.all(userProfiles.map(async (profile: any, profileIndex: number) => {
        try {
          // Use email as the primary identifier to prevent duplicates
          let userId = profile.email || profile.user_id || 'unknown'
          
          // Validate and clean userId
          if (!userId || userId === 'unknown') {
            console.warn(`Invalid userId found in profile at index ${profileIndex}:`, profile)
            userId = 'unknown'
          }
          
          console.log(`Processing profile for user ${userId}:`, {
            strategy_id: profile.strategy_id,
            user_id: profile.user_id,
            lastSignIn: profile.lastSignIn,
            lastLogout: profile.lastLogout,
            status: profile.status,
            type: profile.type
          })
          
          // Get usage records from the correct USER_USAGE_TABLE
          const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
          const usageTable = process.env.USER_USAGE_TABLE || 'f1-user-usage-dev'
          
          let totalSimulations = 0
          let totalStrategies = 0
          let totalAIRecommendations = 0
          
          try {
            // Query usage records for each feature
            const features = ['simulations', 'strategies', 'ai_recommendations']
            
            for (const feature of features) {
              const featureDateKey = `${feature}_${currentDate}`
              
              const getCommand = new GetCommand({
                TableName: usageTable,
                Key: { 
                  user_id: userId,
                  feature_date_key: featureDateKey
                }
              })
              
              const usageResult = await getDocClient().send(getCommand)
              const usageCount = usageResult.Item?.usage_count || 0
              
              switch (feature) {
                case 'simulations':
                  totalSimulations = usageCount
                  break
                case 'strategies':
                  totalStrategies = usageCount
                  break
                case 'ai_recommendations':
                  totalAIRecommendations = usageCount
                  break
              }
            }
          } catch (usageError) {
            console.error(`Error fetching usage data for user ${userId}:`, usageError)
            // Keep default values of 0 if there's an error
          }
          
          console.log(`Usage for user ${userId}:`, {
            simulations: totalSimulations,
            strategies: totalStrategies,
            aiRecommendations: totalAIRecommendations,
            date: currentDate
          })

          // Determine plan based on user data or default to free
          let plan = 'free'
          if (profile.plan || profile.subscription_plan) {
            plan = profile.plan || profile.subscription_plan
          } else if (profile.waitlist_status) {
            // Check if user is on waitlist for specific plans
            if (profile.waitlist_status === 'pro' || profile.waitlist_status === 'business') {
              plan = `waitlist_${profile.waitlist_status}`
            } else {
              plan = 'waitlist'
            }
          } else if (totalStrategies > 10 || totalSimulations > 20) {
            plan = 'pro'
          } else if (totalStrategies > 5 || totalSimulations > 10) {
            plan = 'free'
          }

          // Determine user status based on activity
          let status = profile.status || 'active'
          let lastActive = profile.lastSignIn || profile.last_sign_in || profile.updated_at || profile.created_at || new Date().toISOString()
          
          // Check if user has logged out recently
          if (profile.lastLogout) {
            console.log(`User ${userId} has lastLogout:`, profile.lastLogout)
            const logoutTime = new Date(profile.lastLogout).getTime()
            const lastSignInTime = new Date(profile.lastSignIn || profile.last_sign_in || 0).getTime()
            
            // If logout is more recent than last sign in, user is inactive
            if (logoutTime > lastSignInTime) {
              console.log(`User ${userId} marked inactive due to logout`)
              status = 'inactive'
              lastActive = profile.lastLogout
            }
          }
          
          // Check if user session has expired (inactive after 30 minutes of inactivity)
          const lastActivityTime = new Date(lastActive).getTime()
          const currentTime = Date.now()
          const thirtyMinutes = 30 * 60 * 1000 // 30 minutes in milliseconds
          
          console.log(`User ${userId} - Last activity: ${lastActive}, Current time: ${new Date(currentTime).toISOString()}, Time difference: ${currentTime - lastActivityTime}ms`)
          
          if (currentTime - lastActivityTime > thirtyMinutes) {
            console.log(`User ${userId} marked inactive due to session expiry`)
            status = 'inactive'
          }
          
          // If no last active, use the profile creation date
          if (!lastActive || lastActive === profile.created_at) {
            lastActive = profile.created_at || new Date().toISOString()
          }

          console.log(`Final status for user ${userId}: ${status}`)
          
          // Convert UTC to PST for display
          const convertToPST = (utcString: string) => {
            try {
              const date = new Date(utcString)
              return date.toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).replace(',', '').replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')
            } catch (error) {
              console.error('Error converting time to PST:', error)
              return utcString
            }
          }

          return {
            id: profile.email || userId, // Use email as primary ID to prevent duplicates
            email: profile.email || 'unknown@example.com',
            name: profile.name || profile.user_name || 'Unknown User',
            plan: plan,
            status: status, // Use calculated status
            lastActive: convertToPST(lastActive),
            totalSimulations: totalSimulations,
            totalStrategies: totalStrategies,
            totalAIRecommendations: totalAIRecommendations,
            createdAt: convertToPST(profile.created_at || profile.createdAt || new Date().toISOString()).split(' ')[0]
          }
        } catch (profileError) {
          console.error(`Error processing profile at index ${profileIndex}:`, profileError, 'Profile:', profile)
          // Return a safe fallback user object
          return {
            id: `error_${profileIndex}`,
            email: 'error@example.com',
            name: 'Error User',
            plan: 'free',
            status: 'error',
            lastActive: new Date().toISOString(),
            totalSimulations: 0,
            totalStrategies: 0,
            totalAIRecommendations: 0,
            createdAt: new Date().toISOString().split('T')[0]
          }
        }
      }))

            // If no real users found, return empty array instead of mock data
      if (users.length === 0) {
        users = []
      }
    } catch (error) {
      console.error('Error fetching real user data:', error)
      
      // Check if it's the specific pk.match error
      if (error instanceof Error && error.message.includes('pk.match')) {
        console.error('pk.match error detected in admin users route')
        console.error('This usually indicates malformed primary key data in DynamoDB')
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      } else if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED'))) {
        console.warn('DynamoDB connection failed in admin users route - this is expected when running locally')
        // Don't log network errors as they're expected when running locally
      }
      
      // Return empty array instead of fallback data
      users = []
    }

    // Apply filters
    let filteredUsers = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPlan = planFilter === 'all' || user.plan === planFilter
      return matchesSearch && matchesPlan
    })

    // Apply sorting
    filteredUsers.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]
      
      if (sortBy === 'lastActive' || sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    // Calculate stats
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      freeUsers: users.filter(u => u.plan === 'free').length,
      proUsers: users.filter(u => u.plan === 'pro').length,
      businessUsers: users.filter(u => u.plan === 'business').length,
      waitlistUsers: users.filter(u => u.plan.startsWith('waitlist')).length,
      waitlistProUsers: users.filter(u => u.plan === 'waitlist_pro').length,
      waitlistBusinessUsers: users.filter(u => u.plan === 'waitlist_business').length,
      totalSimulations: users.reduce((sum, u) => sum + u.totalSimulations, 0),
      totalAIRecommendations: users.reduce((sum, u) => sum + u.totalAIRecommendations, 0),
      totalStrategies: users.reduce((sum, u) => sum + u.totalStrategies, 0)
    }

    return NextResponse.json({
      users: paginatedUsers,
      stats,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching admin user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
