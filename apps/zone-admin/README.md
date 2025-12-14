# zone-admin

Admin dashboard zone for the Next.js Multi-Zone PoC.

## Overview

This is the admin Next.js application that serves the `/admin` path of `local.example.com`. It provides health monitoring and user management features, demonstrating how to build a full-stack admin interface within a multi-zone architecture.

## Configuration

### Next.js Config (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  basePath: '/admin',
  output: 'standalone',
};
```

- **basePath**: `/admin` - All routes are prefixed with `/admin`
- **Standalone output**: Optimized for containerized deployment
- **React Compiler**: Enabled for improved performance

## Features

### Health Monitoring

Real-time health status display for the zone-main application:
- Shows current health status (healthy/unhealthy/degraded)
- Displays last check timestamp
- Auto-refreshes every 5 seconds

### User Management

Full CRUD interface for managing users stored in PostgreSQL:
- **List Users**: View all users with their details (ID, name, email, created date)
- **Create User**: Add new users with name and email validation
- **Delete User**: Remove users with confirmation dialog
- **Seed Database**: Populate database with 5 sample users

#### Sample Users (Seeding)
- Alice Johnson (alice@example.com)
- Bob Smith (bob@example.com)
- Charlie Brown (charlie@example.com)
- Diana Prince (diana@example.com)
- Eve Anderson (eve@example.com)

## Routes

- `/admin` - Admin dashboard with health monitoring and user management

## Components

### UserManagement (`app/components/UserManagement.tsx`)

React component that provides the user management interface:
- **State Management**: Uses React hooks (useState, useEffect)
- **API Integration**: Fetches data from backend API at `http://localhost:8080`
- **Real-time Updates**: Auto-refreshes after create/delete operations
- **Error Handling**: Displays user-friendly error messages

## API Integration

The admin zone communicates with the Go backend API:

```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
```

### API Endpoints Used

- `GET /api/zones/status` - Fetch health status of all zones
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `DELETE /api/users/{id}` - Delete a user
- `POST /api/seed` - Seed the database with sample users

## Deployment

This zone runs as a Kubernetes Deployment with:
- **Replicas**: 1
- **Port**: 3000 (internal)
- **Port Forward**: 3002 (for direct access during development)

### Kubernetes Resources

- Deployment: `zone-admin`
- Service: `zone-admin` (ClusterIP)
- Ingress: Routes `/admin` to this service

## Docker

The Dockerfile uses a multi-stage build:

1. **deps**: Install dependencies with pnpm
2. **builder**: Build the Next.js application
3. **runner**: Minimal production image running the standalone server

## Development

When running with Tilt, this zone has live reload enabled. Changes to files will automatically trigger rebuilds.

### Local Development (without Tilt)

```bash
cd apps/zone-admin
pnpm install
pnpm dev
```

Visit: http://localhost:3000/admin

**Note**: When running locally without the backend, the health monitoring and user management features will not work. You need to run the backend and database separately or use Tilt.

## Environment Variables

### Build-time Variables

- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (default: `http://localhost:8080`)

You can set these in:
- `.env.local` for local development
- Kubernetes manifest (`k8s/zone-admin.yaml`) for production deployment

## Styling

Uses Tailwind CSS with a purple color scheme to distinguish from the main zone (blue).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Multi-Zones](https://nextjs.org/docs/pages/building-your-application/deploying/multi-zones)
- [React Hooks](https://react.dev/reference/react)
