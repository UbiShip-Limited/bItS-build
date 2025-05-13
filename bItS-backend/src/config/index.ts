import dotenv from 'dotenv';
import path from 'path';
import { cleanEnv, str, port, host, url, num } from 'envalid';

// Determine the environment and load the appropriate .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const config = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3001 }),
  HOST: host({ default: '0.0.0.0' }),
  LOG_LEVEL: str({
    choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    default: 'info',
  }),

  DATABASE_URI: url(),

  SUPABASE_URL: url(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(), // Be cautious if this is ever client-accessible

  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),

  SQUARE_APPLICATION_ID: str(),
  SQUARE_ACCESS_TOKEN: str(),
  SQUARE_LOCATION_ID: str(),
  SQUARE_ENVIRONMENT: str({ choices: ['sandbox', 'production'], default: 'sandbox' }),

  CORS_ORIGIN: str({ default: 'http://localhost:3000' }), // Default for dev
});

export type AppConfig = Readonly<typeof config>;
export default config;
