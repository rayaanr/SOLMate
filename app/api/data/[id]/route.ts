import { NextRequest } from 'next/server';

// Global type declaration for temporary data store
declare global {
  var tempDataStore: Map<string, any> | undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return Response.json(
        { error: 'Invalid data ID' },
        { 
          status: 400, 
          headers: { 'Cache-Control': 'no-store' } 
        }
      );
    }
    
    // Get data from temporary store
    const tempDataStore = global.tempDataStore as Map<string, any> | undefined;
    
    if (!tempDataStore || !tempDataStore.has(id)) {
      return Response.json(
        { 
          error: 'Data not found or expired',
          message: 'The requested data may have expired (data is stored for 5 minutes) or does not exist.'
        },
        { 
          status: 404, 
          headers: { 'Cache-Control': 'no-store' } 
        }
      );
    }
    
    const data = tempDataStore.get(id);
    
    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('data_fetch_error', error);
    return Response.json(
      { error: 'Failed to fetch data' },
      { 
        status: 500, 
        headers: { 'Cache-Control': 'no-store' } 
      }
    );
  }
}
