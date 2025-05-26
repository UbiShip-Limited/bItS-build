# Tattoo Request Form Integration Testing Guide

## Overview
This guide explains how to test the integration between the frontend tattoo request form and the backend API.

## Setup

### 1. Environment Configuration
Create a `.env.local` file in the root directory with:

```bash
# Backend API Configuration - IMPORTANT: Use the base URL without the endpoint path
BACKEND_API_URL=http://localhost:3001

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/bowen_tattoo_shop

# Cloudinary Configuration (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**⚠️ Important**: The `BACKEND_API_URL` should be just the base URL (`http://localhost:3001`), NOT including the endpoint path (`/tattoo-requests`). The endpoint paths are handled by the frontend API routes.

### 2. Database Setup
Ensure your PostgreSQL database is running and migrate the schema:

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Start Both Servers

Start the backend server (Fastify):
```bash
npm run dev:server
```

In a separate terminal, start the frontend (Next.js):
```bash
npm run dev
```

Or run both together:
```bash
npm run dev:all
```

## Testing the Integration

### Manual Testing

1. **Navigate to the form**: Open http://localhost:3000 and go to your tattoo request form page
2. **Complete Step 1 (Initial Info)**:
   - Select a purpose (e.g., "New tattoo design")
   - Enter email and optional phone
   - Select contact preference
3. **Complete Step 2 (Design Details)**:
   - Enter a detailed description
   - Specify placement (e.g., "Upper arm")
   - Select size and style
   - Choose color preference
4. **Complete Step 3 (Reference Images)**:
   - Optionally upload reference images
   - Submit the form

### Automated Testing

Run the integration tests:
```bash
npm run test:integration
```

Run all tests:
```bash
npm test
```

## Verifying the Integration

### 1. Check API Response
After submitting the form, you should see:
- A success message with the request ID
- A tracking token (for anonymous requests)
- Confirmation of all submitted data

### 2. Check Database
Connect to your PostgreSQL database and verify:
```sql
SELECT * FROM tattoo_requests ORDER BY created_at DESC LIMIT 1;
```

### 3. Check Backend Logs
The backend server should log:
- Incoming POST request to `/tattoo-requests`
- Request payload with all form fields
- Created tattoo request ID

## Common Issues and Solutions

### Issue: "Failed to submit tattoo request"
**Solution**: Ensure the backend server is running on port 3001

### Issue: Missing form fields in database
**Solution**: Check that all fields are included in:
- Frontend: `useTattooRequestForm` hook
- Backend: `lib/routes/tattooRequest.ts` POST handler
- Database: Prisma schema

### Issue: Image upload fails
**Solution**: Verify Cloudinary credentials in `.env.local`

## API Endpoints

The integration uses these endpoints:

- `POST /api/tattoo-requests` - Submit new tattoo request
- `POST /tattoo-requests/upload-images` - Upload reference images
- `GET /api/tattoo-requests` - List requests (admin only)
- `GET /api/tattoo-requests/:id` - Get specific request

## Form Fields Mapping

| Frontend Field | Backend Field | Database Column | Required |
|----------------|---------------|-----------------|----------|
| purpose | purpose | purpose | Yes |
| contactEmail | contactEmail | contact_email | Yes |
| contactPhone | contactPhone | contact_phone | No |
| description | description | description | Yes |
| placement | placement | placement | Yes |
| size | size | size | Yes |
| colorPreference | colorPreference | color_preference | No |
| style | style | style | No |
| preferredArtist | preferredArtist | preferred_artist | No |
| timeframe | timeframe | timeframe | No |
| contactPreference | contactPreference | contact_preference | No |
| additionalNotes | additionalNotes | additional_notes | No |

## Next Steps

After successful integration:
1. Test the appointment booking flow from tattoo requests
2. Implement admin dashboard for managing requests
3. Add email notifications for new requests
4. Set up automated testing in CI/CD pipeline 