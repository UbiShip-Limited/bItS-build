import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const response = await axios.get(`${BACKEND_URL}/appointments/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization') as string
        })
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying GET appointment by ID:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Internal server error' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const response = await axios.put(`${BACKEND_URL}/appointments/${id}`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization') as string
        })
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying PUT appointment:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Internal server error' },
      { status: error.response?.status || 500 }
    );
  }
} 