import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { isAdmin } from '../../lib/admin'
import { redirect } from 'next/navigation'
import AdminDashboard from '../../components/AdminDashboard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is authenticated
  if (!session?.user?.email) {
    redirect('/')
  }
  
  // Check if user is admin
  if (!isAdmin(session.user.email)) {
    redirect('/')
  }
  
  return <AdminDashboard />
}
