# Bowen Island Tattoo Shop - Scripts Reference

This document provides a reference for all available scripts in the project. Use these commands to streamline development, testing, and deployment.

## Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `next dev --turbopack` | Starts the Next.js frontend development server with Turbopack for fast refresh |
| `npm run dev:server` | `npx ts-node-dev --respawn --transpile-only --no-warnings --esm lib/server.ts` | Starts the backend server in development mode with auto-restart |
| `npm run dev:all` | `concurrently "npm:dev" "npm:dev:server"` | Runs both frontend and backend development servers simultaneously |

## Build Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run build` | `next build` | Builds the Next.js frontend for production |
| `npm run build:server` | `tsc -p tsconfig.server.json` | Compiles the TypeScript backend server for production |

## Production Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run start` | `next start` | Starts the Next.js frontend in production mode |
| `npm run start:server` | `node dist/server.js` | Starts the backend server in production mode |

## Testing Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm test` | `cross-env NODE_OPTIONS=--experimental-vm-modules jest` | Runs all tests once |
| `npm run test:watch` | `cross-env NODE_OPTIONS=--experimental-vm-modules jest --watch` | Runs tests in watch mode, rerunning when files change |
| `npm run test:coverage` | `cross-env NODE_OPTIONS=--experimental-vm-modules COVERAGE=true jest` | Runs tests with coverage reporting |

## Linting Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run lint` | `next lint` | Lints the project using ESLint rules |

## Environment Setup

The project supports different environments through the use of environment variables:

- **Development**: Uses `.env.development` or `.env.local`
- **Testing**: Uses `.env.test`
- **Production**: Uses `.env.production`

## Common Workflows

### Starting Development

To start development on both frontend and backend:

```bash
npm run dev:all
```

### Running Tests

Run all tests:

```bash
npm test
```

Run tests with coverage report:

```bash
npm run test:coverage
```

### Building for Production

Build both frontend and backend:

```bash
npm run build && npm run build:server
```

### Deploying to Production

1. Build for production:
   ```bash
   npm run build && npm run build:server
   ```

2. Start the production services:
   ```bash
   npm run start & npm run start:server
   ```

## Testing Patterns

Tests are located in `lib/__tests__/` and follow these patterns:

- Use the Jest testing framework
- Mock external dependencies (especially Prisma database calls)
- Follow the Arrange-Act-Assert pattern
- Use the test helpers from `test-helpers.ts` to simplify test setup

To create new tests, copy the template from `template.test.ts` and customize as needed. 