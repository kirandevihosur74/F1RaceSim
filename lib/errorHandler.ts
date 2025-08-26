// Global error handler to catch unhandled errors
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    // Import and enable error suppression first
    import('./errorSuppressor').then(({ suppressDatabaseErrors }) => {
      suppressDatabaseErrors()
    }).catch(() => {
      console.log('Error suppressor not available, using fallback error handling')
    })
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Check if it's a database-related error
      if (event.reason && isPkMatchError(event.reason)) {
        console.error('Database error detected in unhandled promise rejection')
        console.error('This usually indicates a DynamoDB operation issue')
        event.preventDefault() // Prevent the default browser error handling
        
        // Try to recover gracefully
        try {
          console.log('Attempting to recover from database error...')
        } catch (recoveryError) {
          console.error('Failed to recover from database error:', recoveryError)
        }
      }
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      
      // Check if it's a database-related error
      if (event.error && isPkMatchError(event.error)) {
        console.error('Database error detected in global error handler')
        console.error('This usually indicates a DynamoDB operation issue')
        
        // Try to recover gracefully
        try {
          console.log('Attempting to recover from database error...')
        } catch (recoveryError) {
          console.error('Failed to recover from database error:', recoveryError)
        }
      }
    })

    // Override console.error to catch database-related errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Check if any of the arguments contain database-related errors
      const hasDatabaseError = args.some(arg => {
        if (typeof arg === 'string') {
          return isPkMatchError(arg)
        }
        if (arg && typeof arg === 'object') {
          return isPkMatchError(arg)
        }
        return false
      })
      
      if (hasDatabaseError) {
        console.error('Database error detected in console.error')
        console.error('Stack trace:', new Error().stack)
        
        // Try to recover gracefully
        try {
          console.log('Attempting to recover from database error in console.error...')
        } catch (recoveryError) {
          console.error('Failed to recover from database error in console.error:', recoveryError)
        }
      }
      
      // Call the original console.error
      originalConsoleError.apply(console, args)
    }

    console.log('Global error handling setup complete')
  }
}

// Function to check if an error is related to pk.match or other database issues
export const isPkMatchError = (error: any): boolean => {
  if (!error) return false
  
  const errorString = error.toString()
  const message = error.message || errorString
  const stack = error.stack || ''
  
  // Check for various database-related error patterns
  const databaseErrorPatterns = [
    'pk.match',
    'ValidationException',
    'schema',
    'undefined is not an object',
    'Cannot read properties of undefined',
    'TypeError: undefined is not an object'
  ]
  
  return databaseErrorPatterns.some(pattern => 
    message.includes(pattern) || stack.includes(pattern)
  )
}

// Function to safely handle DynamoDB operations
export const safeDynamoDBOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string = 'Unknown operation'
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    if (isPkMatchError(error)) {
      console.error(`pk.match error in ${context}:`, error)
      console.error('This indicates malformed primary key data in DynamoDB')
      return fallback
    }
    
    console.error(`Error in ${context}:`, error)
    return fallback
  }
}
