import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import { Readable } from 'stream';

// Helper function to convert ReadableStream to Node.js Readable stream
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
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
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    // Handle API error responses
    if (error.response) {
      const { status, data } = error.response;
      return NextResponse.json(data, { status });
    }
    
    // Handle network or other errors
    return NextResponse.json(
      { error: 'Failed to upload file', message: error.message },
      { status: 500 }
    );
  }
} 