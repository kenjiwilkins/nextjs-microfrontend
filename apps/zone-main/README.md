# zone-main

Main landing page zone for the Next.js Multi-Zone PoC.

## Overview

This is the primary Next.js application that serves the root path (`/`) of `local.example.com`. It demonstrates a simple, clean landing page for the multi-zone architecture.

## Configuration

### Next.js Config (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
};
```

- **No basePath**: Serves from root path `/`
- **Standalone output**: Optimized for containerized deployment
- **React Compiler**: Enabled for improved performance

## Routes

- `/` - Main landing page

## Deployment

This zone runs as a Kubernetes Deployment with:
- **Replicas**: 2 (for high availability demonstration)
- **Port**: 3000 (internal)
- **Port Forward**: 3001 (for direct access during development)

### Kubernetes Resources

- Deployment: `zone-main`
- Service: `zone-main` (ClusterIP)
- Ingress: Routes `/` to this service

## Docker

The Dockerfile uses a multi-stage build:

1. **deps**: Install dependencies with pnpm
2. **builder**: Build the Next.js application
3. **runner**: Minimal production image running the standalone server

## Development

When running with Tilt, this zone has live reload enabled. Changes to files will automatically trigger rebuilds.

### Local Development (without Tilt)

```bash
cd apps/zone-main
pnpm install
pnpm dev
```

Visit: http://localhost:3000

## Environment Variables

Currently, this zone does not use environment variables, but you can add them in:
- `.env.local` for local development
- Kubernetes manifest (`k8s/zone-main.yaml`) for production deployment

## Styling

Uses Tailwind CSS with a blue color scheme to distinguish from the admin zone (purple).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Multi-Zones](https://nextjs.org/docs/pages/building-your-application/deploying/multi-zones)
