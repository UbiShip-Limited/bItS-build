import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface AxiosErrorResponse {
  response?: {
    status: number;
    data: unknown;
  };
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get content type to check if it's multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a FormData object for the backend API
    const backendFormData = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    backendFormData.append('file', blob, file.name);
    
    // Send to backend API
    const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    const response = await axios.post(`${apiUrl}/upload`, backendFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // Forward authentication token if available
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization') as string 
        })
      }
    });
    
    // Return the response from the backend
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    
    // Type guard for axios error
    const isAxiosError = (err: unknown): err is AxiosErrorResponse => {
      return typeof err === 'object' && err !== null && 'response' in err;
    };
    
    // Handle API error responses
    if (isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      return NextResponse.json(data, { status });
    }
    
    // Handle network or other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload file', message: errorMessage },
      { status: 500 }
    );
  }
} 