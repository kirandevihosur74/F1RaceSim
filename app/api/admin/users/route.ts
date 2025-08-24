import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { isAdmin } from '../../../../lib/admin'
import { scanTable, queryTable, getItem } from '../../../../lib/dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

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
      const allItems = await scanTable(metadataTable)
      
      // Filter for user profile items
      const userProfiles = allItems.filter((item: any) => 
        item.type === 'USER_PROFILE' || 
        (item.strategy_id?.startsWith('USER_') && item.strategy_id?.endsWith('_PROFILE'))
      )

      // Process each user profile
      users = userProfiles.map((profile: any) => {
        // Extract user ID from strategy_id (e.g., "USER_123_PROFILE" -> "123")
        let userId = profile.strategy_id?.replace('USER_', '').replace('_PROFILE', '') || profile.user_id || 'unknown'
        
        // Validate and clean userId
        if (!userId || userId === 'unknown') {
          console.warn('Invalid userId found in profile:', profile)
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
        
        // Find related items for this user
        const userStrategies = allItems.filter((item: any) => 
          item.user_id === userId && item.type === 'STRATEGY'
        )
        
        const userSimulations = allItems.filter((item: any) => 
          item.user_id === userId && item.type === 'SIMULATION'
        )

        // Calculate usage statistics
        const totalStrategies = userStrategies.length
        const totalSimulations = userSimulations.length
        const totalAIRecommendations = userStrategies.reduce((sum: number, strategy: any) => 
          sum + (strategy.ai_recommendations || 0), 0
        )

        // Determine plan based on user data or default to free
        let plan = 'free'
        if (profile.plan || profile.subscription_plan) {
          plan = profile.plan || profile.subscription_plan
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
        
        // If no last active, use the most recent strategy or simulation
        if (!lastActive || lastActive === profile.created_at) {
          const recentItems = [...userStrategies, ...userSimulations]
          if (recentItems.length > 0) {
            const timestamps = recentItems.map((item: any) => 
              new Date(item.created_at || item.updated_at || item.timestamp || 0).getTime()
            )
            const mostRecent = Math.max(...timestamps)
            if (mostRecent > 0) {
              lastActive = new Date(mostRecent).toISOString()
            }
          }
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
          id: userId,
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
      })

            // If no real users found, return empty array instead of mock data
      if (users.length === 0) {
        users = []
      }
    } catch (error) {
      console.error('Error fetching real user data:', error)
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
