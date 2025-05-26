import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TattooRequestForm from '../../components/forms/TattooRequestForm';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Tattoo Request Form Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('should complete the full tattoo request flow', async () => {
    // Mock successful submission
    server.use(
      http.post('/api/tattoo-requests', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          id: 'test-request-123',
          description: body.description,
          placement: body.placement,
          size: body.size,
          colorPreference: body.colorPreference,
          style: body.style,
          purpose: body.purpose,
          preferredArtist: body.preferredArtist,
          timeframe: body.timeframe,
          contactPreference: body.contactPreference,
          additionalNotes: body.additionalNotes,
          status: 'new',
          createdAt: new Date().toISOString(),
          trackingToken: 'TRACK-TEST-123',
          referenceImages: body.referenceImages || []
        });
      })
    );
    
    const { container } = render(<TattooRequestForm />);
    
    // Step 1: Initial Info
    expect(screen.getByText('Tattoo Request Form')).toBeInTheDocument();
    
    // Fill out step 1
    fireEvent.change(screen.getByLabelText(/Request Purpose/i), {
      target: { value: 'New tattoo design' }
    });
    
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/123.*456.*7890/i), {
      target: { value: '(555) 123-4567' }
    });
    
    // Select contact preference
    fireEvent.click(screen.getByLabelText(/Email/i));
    
    // Go to step 2
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });
    
    // Step 2: Design Details
    fireEvent.change(screen.getByPlaceholderText(/Describe your tattoo idea/i), {
      target: { value: 'A beautiful dragon wrapping around the arm' }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Forearm, back, shoulder/i), {
      target: { value: 'Upper arm' }
    });
    
    fireEvent.change(screen.getByLabelText(/Size/i), {
      target: { value: 'Medium (4-6 inches)' }
    });
    
    fireEvent.change(screen.getByLabelText(/Color Preference/i), {
      target: { value: 'Full color' }
    });
    
    fireEvent.change(screen.getByLabelText(/Style/i), {
      target: { value: 'Japanese' }
    });
    
    // Go to step 3
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText(/Reference Images/i)).toBeInTheDocument();
    });
    
    // Step 3: Skip image upload for now and submit
    fireEvent.click(screen.getByText('Submit Request'));
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Request Submitted Successfully')).toBeInTheDocument();
    });
    
    // Verify success details
    expect(screen.getByText('test-request-123')).toBeInTheDocument();
    expect(screen.getByText('TRACK-TEST-123')).toBeInTheDocument();
  });
  
  it('should handle validation errors', async () => {
    render(<TattooRequestForm />);
    
    // Try to go to next step without filling required fields
    fireEvent.click(screen.getByText('Next'));
    
    // Should still be on step 1
    expect(screen.getByLabelText(/Request Purpose/i)).toBeInTheDocument();
  });
  
  it('should handle submission errors', async () => {
    // Mock error response
    server.use(
      http.post('/api/tattoo-requests', async () => {
        return HttpResponse.json(
          { error: 'Server error occurred' },
          { status: 500 }
        );
      })
    );
    
    render(<TattooRequestForm />);
    
    // Fill out required fields quickly
    fireEvent.change(screen.getByLabelText(/Request Purpose/i), {
      target: { value: 'New tattoo design' }
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Describe your tattoo idea/i), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Forearm, back, shoulder/i), {
      target: { value: 'Arm' }
    });
    fireEvent.change(screen.getByLabelText(/Size/i), {
      target: { value: 'Small (2-3 inches)' }
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Submit Request')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Submit Request'));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Server error occurred/i)).toBeInTheDocument();
    });
  });
}); 