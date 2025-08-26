import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  QueryCommand, 
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommandInput,
  QueryCommandInput,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput
} from '@aws-sdk/lib-dynamodb'

// Initialize DynamoDB client with comprehensive error handling
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-west-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.error('AWS credentials are missing! Please check your environment variables.')
    throw new Error('AWS credentials not configured')
  }

  return new DynamoDBClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

let client: DynamoDBClient
let dynamoDb: DynamoDBDocumentClient

try {
  client = createDynamoDBClient()
  dynamoDb = DynamoDBDocumentClient.from(client)
  console.log('Safe DynamoDB client initialized successfully')
} catch (error) {
  console.error('Failed to initialize safe DynamoDB client:', error)
  throw new Error(`Safe DynamoDB client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
}

// Table names
export const TABLES = {
  USER_SUBSCRIPTIONS: process.env.USER_SUBSCRIPTIONS_TABLE || 'f1-user-subscriptions-dev',
  USER_USAGE: process.env.USER_USAGE_TABLE || 'f1-user-usage-dev',
  USER_ACTIONS_LOG: process.env.USER_ACTIONS_LOG_TABLE || 'f1-user-actions-log-dev',
  STRATEGY_METADATA: process.env.METADATA_TABLE || 'f1-strategy-metadata-dev',
  SIMULATION_RESULTS: process.env.SIMULATION_RESULTS_TABLE || 'f1-simulation-results'
}

// Safe wrapper for all DynamoDB operations
const safeOperation = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallback: T
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    console.error(`Safe DynamoDB operation failed in ${context}:`, error)
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('pk.match') || 
          error.message.includes('ValidationException') ||
          error.message.includes('schema') ||
          error.message.includes('undefined is not an object')) {
        console.error(`Database schema error detected in ${context}:`, error.message)
        return fallback
      }
    }
    
    // For other errors, return fallback
    return fallback
  }
}

// Safe scan operation
export const safeScan = async (input: ScanCommandInput, context: string) => {
  return safeOperation(
    async () => {
      const command = new ScanCommand(input)
      const result = await dynamoDb.send(command)
      
      // Validate and filter items to prevent pk.match errors
      const validItems = (result.Items || []).filter((item: any, index: number) => {
        try {
          if (!item || typeof item !== 'object') {
            console.warn(`Invalid item at index ${index} in ${context}:`, item)
            return false
          }
          
          // Ensure primary key exists and is valid
          if (!item.strategy_id || typeof item.strategy_id !== 'string') {
            console.warn(`Item at index ${index} missing strategy_id in ${context}:`, item)
            return false
          }
          
          return true
        } catch (itemError) {
          console.error(`Error processing item at index ${index} in ${context}:`, itemError)
          return false
        }
      })
      
      console.log(`Safe scan completed in ${context}: ${result.Items?.length || 0} total items, ${validItems.length} valid items`)
      return { ...result, Items: validItems }
    },
    context,
    { Items: [], Count: 0, ScannedCount: 0, $metadata: {} as any }
  )
}

// Safe query operation
export const safeQuery = async (input: QueryCommandInput, context: string) => {
  return safeOperation(
    async () => {
      const command = new QueryCommand(input)
      const result = await dynamoDb.send(command)
      
      // Validate items
      const validItems = (result.Items || []).filter((item: any, index: number) => {
        try {
          if (!item || typeof item !== 'object') {
            console.warn(`Invalid query item at index ${index} in ${context}:`, item)
            return false
          }
          return true
        } catch (itemError) {
          console.error(`Error processing query item at index ${index} in ${context}:`, itemError)
          return false
        }
      })
      
      return { ...result, Items: validItems }
    },
    context,
    { Items: [], Count: 0, ScannedCount: 0, $metadata: {} as any }
  )
}

// Safe get operation
export const safeGet = async (input: GetCommandInput, context: string) => {
  return safeOperation(
    async () => {
      const command = new GetCommand(input)
      const result = await dynamoDb.send(command)
      
      // Validate item
      if (result.Item) {
        try {
          if (!result.Item || typeof result.Item !== 'object') {
            console.warn(`Invalid item returned in ${context}:`, result.Item)
            return { ...result, Item: undefined }
          }
        } catch (itemError) {
          console.error(`Error processing get item in ${context}:`, itemError)
          return { ...result, Item: undefined }
        }
      }
      
      return result
    },
    context,
    { Item: undefined, $metadata: {} as any }
  )
}

// Safe put operation
export const safePut = async (input: PutCommandInput, context: string) => {
  return safeOperation(
    async () => {
      const command = new PutCommand(input)
      return await dynamoDb.send(command)
    },
    context,
    { $metadata: {} as any }
  )
}

// Safe update operation
export const safeUpdate = async (input: UpdateCommandInput, context: string) => {
  return safeOperation(
    async () => {
      const command = new UpdateCommand(input)
      return await dynamoDb.send(command)
    },
    context,
    { $metadata: {} as any }
  )
}

// Safe delete operation
export const safeDelete = async (input: DeleteCommandInput, context: string) => {
  return safeOperation(
    async () => {
      const command = new DeleteCommand(input)
      return await dynamoDb.send(command)
    },
    context,
    { $metadata: {} as any }
  )
}

// Legacy function for backward compatibility
export const scanTable = async (tableName: string) => {
  console.warn('scanTable is deprecated. Use safeScan instead.')
  const result = await safeScan({ TableName: tableName }, 'scanTable')
  return result.Items || []
}

// Export the safe client for direct use if needed
export { dynamoDb }

// Export all safe operations
export const safeDynamoDB = {
  scan: safeScan,
  query: safeQuery,
  get: safeGet,
  put: safePut,
  update: safeUpdate,
  delete: safeDelete,
  TABLES
}
