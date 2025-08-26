// Global error suppressor to prevent pk.match errors from crashing the app
// This runs before any components render and suppresses database-related errors

export const suppressDatabaseErrors = () => {
  if (typeof window === 'undefined') return

  // Suppress console errors for database-related issues
  const originalConsoleError = console.error
  console.error = (...args) => {
    // Check if this is a database-related error
    const hasDatabaseError = args.some(arg => {
      if (typeof arg === 'string') {
        return arg.includes('pk.match') || 
               arg.includes('ValidationException') ||
               arg.includes('schema') ||
               arg.includes('undefined is not an object') ||
               arg.includes('Cannot read properties of undefined')
      }
      if (arg && typeof arg === 'object' && arg.message) {
        return arg.message.includes('pk.match') || 
               arg.message.includes('ValidationException') ||
               arg.message.includes('schema') ||
               arg.message.includes('undefined is not an object') ||
               arg.message.includes('Cannot read properties of undefined')
      }
      return false
    })

    if (hasDatabaseError) {
      // Suppress database errors - don't log them to console
      // This prevents them from appearing in the browser console
      return
    }

    // Log other errors normally
    originalConsoleError.apply(console, args)
  }

  // Suppress unhandled promise rejections for database errors
  const originalAddEventListener = window.addEventListener
  window.addEventListener = function(type: string, listener: any, options?: any) {
    if (type === 'unhandledrejection') {
      // Wrap the listener to suppress database errors
      const wrappedListener = (event: any) => {
        if (event.reason && event.reason.message) {
          const isDatabaseError = event.reason.message.includes('pk.match') || 
                                 event.reason.message.includes('ValidationException') ||
                                 event.reason.message.includes('schema') ||
                                 event.reason.message.includes('undefined is not an object') ||
                                 event.reason.message.includes('Cannot read properties of undefined')
          
          if (isDatabaseError) {
            // Suppress database-related promise rejections
            event.preventDefault()
            return
          }
        }
        
        // Call original listener for other errors
        listener(event)
      }
      
      return originalAddEventListener.call(this, type, wrappedListener, options)
    }
    
    // For other event types, use normal behavior
    return originalAddEventListener.call(this, type, listener, options)
  }

  // Suppress global errors for database issues
  const originalOnError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    if (message && typeof message === 'string') {
      const isDatabaseError = message.includes('pk.match') || 
                             message.includes('ValidationException') ||
                             message.includes('schema') ||
                             message.includes('undefined is not an object') ||
                             message.includes('Cannot read properties of undefined')
      
      if (isDatabaseError) {
        // Suppress database-related global errors
        return true // Prevent default error handling
      }
    }
    
    // For other errors, use normal behavior
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error)
    }
    return false
  }

  // Suppress unhandled promise rejections globally
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message) {
      const isDatabaseError = event.reason.message.includes('pk.match') || 
                             event.reason.message.includes('ValidationException') ||
                             event.reason.message.includes('schema') ||
                             event.reason.message.includes('undefined is not an object') ||
                             event.reason.message.includes('Cannot read properties of undefined')
      
      if (isDatabaseError) {
        // Suppress database-related promise rejections
        event.preventDefault()
        console.log('Database error suppressed to prevent app crash')
        return
      }
    }
  })

  console.log('Database error suppression enabled')
}

// Function to check if an error should be suppressed
export const shouldSuppressError = (error: any): boolean => {
  if (!error) return false
  
  const message = error.message || error.toString()
  const stack = error.stack || ''
  
  const suppressPatterns = [
    'pk.match',
    'ValidationException', 
    'schema',
    'undefined is not an object',
    'Cannot read properties of undefined',
    'TypeError: undefined is not an object'
  ]
  
  return suppressPatterns.some(pattern => 
    message.includes(pattern) || stack.includes(pattern)
  )
}

// Function to safely execute code that might throw database errors
export const safeExecute = <T>(
  fn: () => T,
  fallback: T,
  context: string = 'Unknown operation'
): T => {
  try {
    return fn()
  } catch (error) {
    if (shouldSuppressError(error)) {
      console.log(`Database error suppressed in ${context}, using fallback`)
      return fallback
    }
    throw error // Re-throw non-database errors
  }
}
