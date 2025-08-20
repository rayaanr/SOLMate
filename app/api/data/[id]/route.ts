import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get data from temporary store
    const tempDataStore = global.tempDataStore as Map<string, any> | undefined;
    
    if (!tempDataStore || !tempDataStore.has(id)) {
      return new Response('Data not found or expired', { status: 404 });
    }
    
    const data = tempDataStore.get(id);
    
    return Response.json(data);
  } catch (error) {
    console.error('data_fetch_error', error);
    return new Response('Failed to fetch data', { status: 500 });
  }
}
