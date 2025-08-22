'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, 
  BarChart3, 
  Activity, 
  Shield, 
  Eye, 
  Settings, 
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import BackButton from './BackButton'

interface UserData {
  id: string
  email: string
  name: string
  plan: string
  status: string
  lastActive: string
  totalSimulations: number
  totalStrategies: number
  totalAIRecommendations: number
  createdAt: string
}

interface UsageStats {
  totalUsers: number
  activeUsers: number
  freeUsers: number
  proUsers: number
  businessUsers: number
  totalSimulations: number
  totalAIRecommendations: number
  totalStrategies: number
}

interface SystemHealth {
  databaseStatus: 'healthy' | 'warning' | 'error'
  apiStatus: 'healthy' | 'warning' | 'error'
  lastBackup: string
  uptime: string
}

const AdminDashboard = () => {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<UsageStats>({
    totalUsers: 0,
    activeUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    businessUsers: 0,
    totalSimulations: 0,
    totalAIRecommendations: 0,
    totalStrategies: 0
  })
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    databaseStatus: 'healthy',
    apiStatus: 'healthy',
    lastBackup: '2024-01-15 02:00:00',
    uptime: '99.9%'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [sortBy, setSortBy] = useState('lastActive')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Fetch real data from admin APIs
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if user is authenticated
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch user data
        const userResponse = await fetch('/api/admin/users')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUsers(userData.users)
          setStats(userData.stats)
        } else {
          console.error('Failed to fetch user data:', userResponse.status, userResponse.statusText)
          setError(`Failed to fetch user data: ${userResponse.status}`)
        }
        
        // Fetch system health
        const healthResponse = await fetch('/api/admin/system-health')
        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          setSystemHealth({
            databaseStatus: healthData.systemHealth.databaseStatus,
            apiStatus: healthData.systemHealth.apiStatus,
            lastBackup: healthData.systemHealth.lastBackup,
            uptime: healthData.systemHealth.uptime
          })
        } else {
          console.error('Failed to fetch system health:', healthResponse.status, healthResponse.statusText)
          setError(`Failed to fetch system health: ${healthResponse.status}`)
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session?.user])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan
    return matchesSearch && matchesPlan
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any = a[sortBy as keyof UserData]
    let bValue: any = b[sortBy as keyof UserData]
    
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
      case 'suspended': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
      case 'pro': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300'
      case 'business': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const exportUserData = () => {
    const csvContent = [
      ['ID', 'Name', 'Email', 'Plan', 'Status', 'Last Active', 'Simulations', 'Strategies', 'AI Recommendations', 'Created'],
      ...sortedUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.plan,
        user.status,
        user.lastActive,
        user.totalSimulations.toString(),
        user.totalStrategies.toString(),
        user.totalAIRecommendations.toString(),
        user.createdAt
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton href="/" label="Back to Dashboard" variant="outlined" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor users, track usage, and manage system health
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportUserData}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeUsers}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Simulations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSimulations}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Recommendations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalAIRecommendations}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <span>System Health</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth.databaseStatus)}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
            <span className={`text-sm font-medium ${getHealthColor(systemHealth.databaseStatus)}`}>
              {systemHealth.databaseStatus}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth.apiStatus)}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">API</span>
            <span className={`text-sm font-medium ${getHealthColor(systemHealth.apiStatus)}`}>
              {systemHealth.apiStatus}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {systemHealth.uptime}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Last Backup</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {systemHealth.lastBackup}
            </span>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <span>User Management</span>
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="lastActive-desc">Last Active (Newest)</option>
              <option value="lastActive-asc">Last Active (Oldest)</option>
              <option value="createdAt-desc">Created (Newest)</option>
              <option value="createdAt-asc">Created (Oldest)</option>
              <option value="totalSimulations-desc">Simulations (High)</option>
              <option value="totalSimulations-asc">Simulations (Low)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(user.plan)}`}>
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 dark:text-gray-400">Sim:</span>
                          <span>{user.totalSimulations}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 dark:text-gray-400">AI:</span>
                          <span>{user.totalAIRecommendations}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 dark:text-gray-400">Strats:</span>
                          <span>{user.totalStrategies}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.lastActive}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                        <Settings className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No users found in the system.</p>
                      <p className="text-xs mt-1">Users will appear here once they sign in and create content.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
