import toast from 'react-hot-toast'

// Toast cooldown management
const toastCooldowns = new Map<string, number>()
const DEFAULT_COOLDOWN = 2000 // 2 seconds

interface ToastOptions {
  icon?: string
  duration?: number
  cooldown?: number
  style?: any
}

/**
 * Custom toast function with built-in spam protection
 * @param message - The toast message
 * @param type - The toast type (success, error, or default)
 * @param options - Additional toast options
 */
export const showToast = (
  message: string, 
  type: 'success' | 'error' | 'default' = 'default',
  options: ToastOptions = {}
) => {
  const { icon, duration = 3000, cooldown = DEFAULT_COOLDOWN, style } = options
  
  // Create a unique key for this toast message
  const toastKey = `${type}:${message}`
  const now = Date.now()
  const lastToastTime = toastCooldowns.get(toastKey) || 0
  
  // Check if enough time has passed since last toast
  if (now - lastToastTime < cooldown) {
    return // Still in cooldown, don't show toast
  }
  
  // Update last toast time
  toastCooldowns.set(toastKey, now)
  
  // Show toast based on type
  switch (type) {
    case 'success':
      toast.success(message, { icon, duration, style })
      break
    case 'error':
      toast.error(message, { icon, duration, style })
      break
    default:
      toast(message, { icon, duration, style })
      break
  }
}

/**
 * Convenience functions for common toast types
 */
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  showToast(message, 'success', options)
}

export const showErrorToast = (message: string, options?: ToastOptions) => {
  showToast(message, 'error', options)
}

export const showInfoToast = (message: string, options?: ToastOptions) => {
  showToast(message, 'default', options)
}

/**
 * Clear all toast cooldowns (useful for testing or resetting)
 */
export const clearToastCooldowns = () => {
  toastCooldowns.clear()
}

/**
 * Get remaining cooldown time for a specific toast
 */
export const getToastCooldownRemaining = (message: string, type: 'success' | 'error' | 'default' = 'default') => {
  const toastKey = `${type}:${message}`
  const lastToastTime = toastCooldowns.get(toastKey) || 0
  const now = Date.now()
  const remaining = Math.max(0, DEFAULT_COOLDOWN - (now - lastToastTime))
  return remaining
}
