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
        const userId = profile.strategy_id?.replace('USER_', '').replace('_PROFILE', '') || profile.user_id || 'unknown'
        
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

        // Get last active time
        let lastActive = profile.lastSignIn || profile.last_sign_in || profile.updated_at || profile.created_at || new Date().toISOString()
        
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

        return {
          id: userId,
          email: profile.email || 'unknown@example.com',
          name: profile.name || profile.user_name || 'Unknown User',
          plan: plan,
          status: profile.status || 'active',
          lastActive: new Date(lastActive).toISOString().slice(0, 19).replace('T', ' '),
          totalSimulations: totalSimulations,
          totalStrategies: totalStrategies,
          totalAIRecommendations: totalAIRecommendations,
          createdAt: profile.created_at || profile.createdAt || new Date().toISOString().slice(0, 10)
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
