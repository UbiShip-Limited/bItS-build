import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${BACKEND_URL}/appointments${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization') as string
        })
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying GET appointments:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Internal server error' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await axios.post(`${BACKEND_URL}/appointments`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization') as string
        })
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying POST appointments:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Internal server error' },
      { status: error.response?.status || 500 }
    );
  }
} 