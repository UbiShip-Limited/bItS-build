import { build } from '../../server';
import { FastifyInstance } from 'fastify';

describe('Tattoo Request Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /tattoo-requests', () => {
    it('should create a new tattoo request with all fields', async () => {
      const tattooRequestData = {
        contactEmail: 'test@example.com',
        contactPhone: '123-456-7890',
        description: 'I want a beautiful dragon tattoo',
        placement: 'upper arm',
        size: 'medium',
        colorPreference: 'black and grey',
        style: 'traditional',
        purpose: 'new_tattoo',
        preferredArtist: 'Any artist',
        timeframe: '1-3 months',
        contactPreference: 'email',
        additionalNotes: 'I have sensitive skin',
        referenceImages: [
          {
            url: 'https://example.com/image1.jpg',
            publicId: 'image1'
          }
        ]
      };

      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests',
        payload: tattooRequestData
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.payload);
      
      // Verify response contains all submitted data
      expect(responseData).toMatchObject({
        contactEmail: tattooRequestData.contactEmail,
        contactPhone: tattooRequestData.contactPhone,
        description: tattooRequestData.description,
        placement: tattooRequestData.placement,
        size: tattooRequestData.size,
        colorPreference: tattooRequestData.colorPreference,
        style: tattooRequestData.style,
        purpose: tattooRequestData.purpose,
        additionalNotes: tattooRequestData.additionalNotes,
        referenceImages: tattooRequestData.referenceImages,
        status: 'new'
      });
      
      // Verify tracking token is generated for anonymous requests
      expect(responseData.trackingToken).toBeDefined();
      expect(responseData.id).toBeDefined();
    });

    it('should reject request without required fields', async () => {
      const invalidData = {
        contactPhone: '123-456-7890',
        // Missing required contactEmail and description
      };

      const response = await app.inject({
        method: 'POST',
        url: '/tattoo-requests',
        payload: invalidData
      });

      expect(response.statusCode).toBe(400);
    });
  });
}); 