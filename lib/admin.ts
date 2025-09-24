// Admin configuration and access control

export const ADMIN_EMAILS = [
  // Add your email addresses here for admin access
  'kirandevihosur74@gmail.com',
  'dkiran760@gmail.com' // Replace with your actual email
]

export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export const ADMIN_FEATURES = {
  userManagement: true,
  systemMonitoring: true,
  usageAnalytics: true,
  dataExport: true,
  planManagement: true
} as const

export type AdminFeature = keyof typeof ADMIN_FEATURES

export const canAccessFeature = (email: string | null | undefined, feature: AdminFeature): boolean => {
  if (!isAdmin(email)) return false
  return ADMIN_FEATURES[feature]
}
