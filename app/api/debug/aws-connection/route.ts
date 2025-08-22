import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const region = process.env.AWS_REGION || 'us-west-1'
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const metadataTable = process.env.METADATA_TABLE || 'f1-strategy-metadata-dev'

    console.log('=== AWS Connection Debug ===')
    console.log('Region:', region)
    console.log('Access Key ID:', accessKeyId ? `${accessKeyId.substring(0, 4)}...` : 'MISSING')
    console.log('Secret Access Key:', secretAccessKey ? 'PRESENT' : 'MISSING')
    console.log('Metadata Table:', metadataTable)

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({
        success: false,
        error: 'AWS credentials are missing',
        details: {
          region,
          accessKeyId: accessKeyId ? 'PRESENT' : 'MISSING',
          secretAccessKey: secretAccessKey ? 'PRESENT' : 'MISSING',
          metadataTable
        }
      }, { status: 500 })
    }

    // Test AWS connection
    const client = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    // Try to list tables to test connection
    const listTablesCommand = new ListTablesCommand({})
    const result = await client.send(listTablesCommand)

    console.log('Available tables:', result.TableNames)

    return NextResponse.json({
      success: true,
      message: 'AWS connection successful',
      details: {
        region,
        accessKeyId: `${accessKeyId.substring(0, 4)}...`,
        availableTables: result.TableNames || [],
        targetTable: metadataTable,
        tableExists: result.TableNames?.includes(metadataTable) || false
      }
    })

  } catch (error: any) {
    console.error('AWS connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'AWS connection failed',
      details: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorCode: error.$metadata?.httpStatusCode || 'unknown'
      }
    }, { status: 500 })
  }
}
