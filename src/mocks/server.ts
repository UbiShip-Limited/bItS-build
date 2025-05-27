import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock the tattoo request submission
  http.post('/api/tattoo-requests', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: 'tattoo-123',
      description: body.description,
      placement: body.placement,
      size: body.size,
      colorPreference: body.colorPreference || '',
      style: body.style || '',
      status: 'new',
      createdAt: new Date().toISOString(),
      trackingToken: 'TRACK-ABC123',
      referenceImages: body.referenceImages || []
    });
  }),

  // Mock image upload
  http.post('/tattoo-requests/upload-images', async () => {
    return HttpResponse.json({
      images: [{
        url: 'https://example.com/image.jpg',
        publicId: 'test-public-id',
        originalName: 'test.jpg'
      }]
    });
  }),

  // Mock cloudinary signature
  http.post('/api/cloudinary/signature', () => {
    return HttpResponse.json({
      signature: 'test-signature',
      timestamp: Date.now(),
      apiKey: 'test-api-key',
      cloudName: 'test-cloud'
    });
  })
];

export const server = setupServer(...handlers); 