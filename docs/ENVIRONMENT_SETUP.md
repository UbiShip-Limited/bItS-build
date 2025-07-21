# Environment Setup Guide

## Required Environment Variables

To run the Bowen Island Tattoo Shop application, you need to set up environment variables for both the frontend and backend.

### 1. Create `.env` file

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

### 2. Database Setup

You need a PostgreSQL database. Options:

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create a database
createdb bowen_island_tattoo

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://username:password@localhost:5432/bowen_island_tattoo"
```

#### Option B: Supabase Database (Recommended)
1. Go to your Supabase project
2. Navigate to Settings > Database
3. Copy the connection string
4. Update DATABASE_URL in .env

### 3. Supabase Configuration

From your Supabase project:
1. Copy the Project URL → `SUPABASE_URL`
2. Copy the anon/public key → `SUPABASE_ANON_KEY` 
3. Copy the service role key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Square API Setup

From your Square account:
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create or select your application
3. Copy:
   - Access Token → `SQUARE_ACCESS_TOKEN`
   - Application ID → `SQUARE_APPLICATION_ID`
   - Location ID → `SQUARE_LOCATION_ID` (from Locations tab)
   - Webhook Signature Key → `SQUARE_WEBHOOK_SIGNATURE_KEY` (from Webhooks tab)
4. Set `SQUARE_ENVIRONMENT` to `sandbox` for testing or `production` for live

### 5. Cloudinary Setup

From your Cloudinary account:
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy:
   - Cloud Name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

### 6. Run Database Migrations

Once your `.env` file is configured:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database with test data
npx prisma db seed
```

### 7. Verify Setup

```bash
# Test database connection
npx prisma db pull

# Start the application
npm run dev:all
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `SQUARE_ACCESS_TOKEN` | Square API access token | `EAAA...` |
| `SQUARE_APPLICATION_ID` | Square application ID | `sandbox-sq0idb-...` |
| `SQUARE_LOCATION_ID` | Square location ID | `L...` |
| `SQUARE_ENVIRONMENT` | Square environment | `sandbox` or `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3000` |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | For Square webhooks | - |

## Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Make sure you've created a `.env` file (not just `.env.local`)
- Check that `DATABASE_URL` is properly set in the `.env` file

### Database connection errors
- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists

### Square API errors
- Verify you're using the correct environment (sandbox vs production)
- Check that all Square credentials are from the same environment
- Ensure location ID matches your Square account