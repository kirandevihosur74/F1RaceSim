import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export const useLogoutTracking = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    if (session?.user?.id) {
      try {
        // Track logout before signing out
        await fetch('/api/users/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
            logoutTime: new Date().toISOString()
          }),
        })
      } catch (error) {
        console.error('Error tracking logout:', error)
      }
    }
    
    // Sign out from NextAuth
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  return { handleLogout }
}
