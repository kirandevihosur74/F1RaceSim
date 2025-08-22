import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  QueryCommand, 
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'

// Initialize DynamoDB client with improved error handling
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-west-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  // Log configuration for debugging (without exposing secrets)
  console.log('AWS DynamoDB Configuration:')
  console.log('- Region:', region)
  console.log('- Access Key ID:', accessKeyId ? `${accessKeyId.substring(0, 4)}...` : 'MISSING')
  console.log('- Secret Access Key:', secretAccessKey ? 'PRESENT' : 'MISSING')

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

const client = createDynamoDBClient()

// Create DynamoDB Document client for easier operations
export const dynamoDb = DynamoDBDocumentClient.from(client)

// Table names - use actual table names from your infrastructure
export const TABLES = {
  USER_SUBSCRIPTIONS: process.env.USER_SUBSCRIPTIONS_TABLE || 'f1-user-subscriptions-dev',
  USER_USAGE: process.env.USER_USAGE_TABLE || 'f1-user-usage-dev',
  USER_ACTIONS_LOG: process.env.USER_ACTIONS_LOG_TABLE || 'f1-user-actions-log-dev',
  STRATEGY_METADATA: process.env.METADATA_TABLE || 'f1-strategy-metadata-dev',
  SIMULATION_RESULTS: process.env.SIMULATION_RESULTS_TABLE || 'f1-simulation-results'
}

// Helper functions for common operations
export const scanTable = async (tableName: string) => {
  try {
    const command = new ScanCommand({
      TableName: tableName
    })
    const result = await dynamoDb.send(command)
    return result.Items || []
  } catch (error) {
    console.error(`Error scanning table ${tableName}:`, error)
    throw error
  }
}

export const queryTable = async (tableName: string, keyCondition: any, indexName?: string) => {
  try {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyCondition.expression,
      ExpressionAttributeValues: keyCondition.values,
      IndexName: indexName
    })
    const result = await dynamoDb.send(command)
    return result.Items || []
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error)
    throw error
  }
}

export const getItem = async (tableName: string, key: any) => {
  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: key
    })
    const result = await dynamoDb.send(command)
    return result.Item
  } catch (error) {
    console.error(`Error getting item from ${tableName}:`, error)
    throw error
  }
}

export const putItem = async (tableName: string, item: any) => {
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item
    })
    await dynamoDb.send(command)
    return true
  } catch (error) {
    console.error(`Error putting item to ${tableName}:`, error)
    throw error
  }
}

// Helper to check table health
export const checkTableHealth = async (tableName: string) => {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: 1
    })
    await dynamoDb.send(command)
    return { status: 'healthy', tableName }
  } catch (error) {
    console.error(`Table ${tableName} health check failed:`, error)
    return { status: 'error', tableName, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
