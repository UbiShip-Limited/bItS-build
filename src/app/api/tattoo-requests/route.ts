import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // Forward request to backend
    const response = await axios.post(`${apiUrl}/tattoo-requests`, body, {
      headers: {
        'Content-Type': 'application/json',
        // Forward authentication token if available
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization') as string 
        })
      }
    });
    
    // Return the response from the backend
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error submitting tattoo request:', error);
    
    // Handle API error responses
    if (error.response) {
      const { status, data } = error.response;
      return NextResponse.json(data, { status });
    }
    
    // Handle network or other errors
    return NextResponse.json(
      { error: 'Failed to submit tattoo request', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Forward GET request to backend (for admin routes)
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${apiUrl}/tattoo-requests${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, {
      headers: {
        // Forward authentication token if available
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization') as string 
        })
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching tattoo requests:', error);
    
    // Handle API error responses
    if (error.response) {
      const { status, data } = error.response;
      return NextResponse.json(data, { status });
    }
    
    // Handle network or other errors
    return NextResponse.json(
      { error: 'Failed to fetch tattoo requests', message: error.message },
      { status: 500 }
    );
  }
}
