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

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Create DynamoDB Document client for easier operations
export const dynamoDb = DynamoDBDocumentClient.from(client)

// Table names based on environment
const ENV = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'

export const TABLES = {
  USER_SUBSCRIPTIONS: `f1-user-subscriptions-${ENV}`,
  USER_USAGE: `f1-user-usage-${ENV}`,
  USER_ACTIONS_LOG: `f1-user-actions-log-${ENV}`,
  STRATEGY_METADATA: `f1-strategy-metadata-${ENV}`,
  SIMULATION_RESULTS: 'f1-simulation-results'
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
