// Global error handler to catch unhandled errors
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Check if it's the pk.match error
      if (event.reason && typeof event.reason === 'string' && event.reason.includes('pk.match')) {
        console.error('pk.match error detected in unhandled promise rejection')
        console.error('This usually indicates a DynamoDB operation issue')
        event.preventDefault() // Prevent the default browser error handling
      }
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      
      // Check if it's the pk.match error
      if (event.error && typeof event.error === 'string' && event.error.includes('pk.match')) {
        console.error('pk.match error detected in global error handler')
        console.error('This usually indicates a DynamoDB operation issue')
      }
    })

    // Override console.error to catch pk.match errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Check if any of the arguments contain pk.match
      const hasPkMatch = args.some(arg => 
        typeof arg === 'string' && arg.includes('pk.match')
      )
      
      if (hasPkMatch) {
        console.error('pk.match error detected in console.error')
        console.error('Stack trace:', new Error().stack)
      }
      
      // Call the original console.error
      originalConsoleError.apply(console, args)
    }

    console.log('Global error handling setup complete')
  }
}

// Function to check if an error is related to pk.match
export const isPkMatchError = (error: any): boolean => {
  if (!error) return false
  
  const errorString = error.toString()
  const message = error.message || errorString
  const stack = error.stack || ''
  
  return message.includes('pk.match') || stack.includes('pk.match')
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
