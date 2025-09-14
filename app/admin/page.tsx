import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { isAdmin } from '../../lib/admin'
import { redirect } from 'next/navigation'
import AdminDashboard from '../../components/AdminDashboard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  // Debug logging
  console.log('Admin page access attempt:', {
    hasSession: !!session,
    userEmail: session?.user?.email,
    isAuthenticated: !!session?.user?.email
  })
  
  // Check if user is authenticated
  if (!session?.user?.email) {
    console.log('Redirecting: No session or email')
    redirect('/')
  }
  
  // Check if user is admin
  const userIsAdmin = isAdmin(session.user.email)
  console.log('Admin check result:', userIsAdmin)
  
  if (!userIsAdmin) {
    console.log('Redirecting: User is not admin')
    redirect('/')
  }
  
  console.log('Admin access granted')
  return <AdminDashboard />
}
