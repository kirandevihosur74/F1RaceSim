import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Dynamically determine the NEXTAUTH_URL based on environment
const getNextAuthUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Fallback for Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Default to localhost for development
  return 'http://localhost:3000'
}

// Function to store user in DynamoDB
const storeUserInDatabase = async (user: any, account: any, profile: any) => {
  try {
    // Use Google profile ID as the primary user ID
    const userId = profile?.sub || account?.providerAccountId || user.id || user.email
    
    const userData = {
      id: userId,
      email: user.email,
      name: user.name,
      image: user.image,
      provider: 'google',
      providerId: account?.providerAccountId || user.id,
    }

    console.log('Storing user data:', {
      userId: userData.id,
      email: userData.email,
      providerId: userData.providerId
    })

    const response = await fetch(`${getNextAuthUrl()}/api/users/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      console.error('Failed to store user in database:', await response.text())
    } else {
      console.log('User stored successfully in database')
    }
  } catch (error) {
    console.error('Error storing user in database:', error)
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Store user in database on successful sign-in
      if (user && user.email) {
        await storeUserInDatabase(user, account, profile)
      }
      return true
    },

    async session({ session, token }: any) {
      // Add user ID to session for easy access
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },

    async jwt({ token, user }: any) {
      // Add user ID to JWT token
      if (user) {
        token.sub = user.id
      }
      return token
    },

    async signOut({ token }: any) {
      // Track user logout
      if (token?.sub) {
        try {
          await fetch(`${getNextAuthUrl()}/api/users/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: token.sub,
              logoutTime: new Date().toISOString()
            }),
          })
        } catch (error) {
          console.error('Error tracking logout:', error)
        }
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Set the base URL dynamically
  basePath: '/api/auth',
  // Ensure proper URL handling
  useSecureCookies: process.env.NODE_ENV === 'production',
}

// Export the URL for use in other parts of the app
export const nextAuthUrl = getNextAuthUrl()
