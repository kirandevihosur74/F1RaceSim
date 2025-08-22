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

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
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
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Set the base URL dynamically
  basePath: '/api/auth',
  // Ensure proper URL handling
  useSecureCookies: process.env.NODE_ENV === 'production',
}

// Export the URL for use in other parts of the app
export const nextAuthUrl = getNextAuthUrl()
