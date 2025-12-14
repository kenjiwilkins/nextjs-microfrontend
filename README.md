# Next.js Multi-Zone PoC

A Proof of Concept demonstrating a local multi-zone Next.js architecture using Kubernetes (kind), Tilt, and mkcert for local HTTPS development.

## ⚠️ Security Notice

**This is a local development PoC only. DO NOT use in production.**

- Database password is intentionally hardcoded as `"devpassword"` for local testing
- All services run on localhost without authentication
- Certificates must be generated locally with mkcert
- This project is for learning and demonstration purposes only

## Architecture

This PoC runs two Next.js applications as separate "zones" under a single domain, with a Go backend API and PostgreSQL database:

```
local.example.com
 ├── /           → zone-main (Next.js app #1)
 └── /admin      → zone-admin (Next.js app #2) + User Management UI

Backend Services:
 ├── backend     → Go API (health checks, user CRUD, database seeding)
 └── postgres    → PostgreSQL database (user data)
```

Each zone runs in its own Kubernetes Pod with separate Services. An Ingress controller routes requests based on path prefixes. The backend provides health monitoring and user management APIs consumed by the admin zone.

## Prerequisites

Before starting, ensure you have the following tools installed:

- **Docker Desktop** - [Install Docker](https://www.docker.com/products/docker-desktop)
- **kind** (Kubernetes in Docker) - [Install kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- **kubectl** - [Install kubectl](https://kubernetes.io/docs/tasks/tools/)
- **Tilt** - [Install Tilt](https://docs.tilt.dev/install.html)
- **mkcert** - [Install mkcert](https://github.com/FiloSottile/mkcert#installation)
- **pnpm** - [Install pnpm](https://pnpm.io/installation)

### Installation Commands (macOS with Homebrew)

```bash
brew install kind kubectl tilt mkcert pnpm
```

## Quick Start

### 1. Clone and Setup

First, generate the local HTTPS certificates using mkcert:

```bash
cd certs
mkcert local.example.com
cd ..
```

This will create:
- `local.example.com.pem` (certificate)
- `local.example.com-key.pem` (private key)

**Note**: Certificate files are gitignored for security and must be generated locally on each machine.

### 2. Create the Kind Cluster

Run the setup script to create a kind cluster, install ingress-nginx, and configure TLS:

```bash
./setup.sh
```

This script will:
- Create a kind cluster named `multizone-poc`
- Install ingress-nginx controller
- Wait for ingress-nginx to be ready
- Create a Kubernetes TLS secret from mkcert certificates
- Add `local.example.com` to `/etc/hosts` (requires sudo)

### 3. Start Development with Tilt

```bash
tilt up
```

Tilt will:
- Build Docker images for both zones
- Deploy them to the kind cluster
- Set up live reloading
- Forward ports for direct access

**Access the Tilt UI:**
- If running in the foreground: press `space` to open the browser
- Or visit: http://localhost:10350/

The Tilt UI lets you monitor builds, view logs, and check resource status.

### 4. Access the Application

Once Tilt shows all resources are ready:

- **Main Zone**: [https://local.example.com/](https://local.example.com/)
- **Admin Zone**: [https://local.example.com/admin](https://local.example.com/admin)

**Direct Pod Access** (for debugging):
- zone-main: [http://localhost:3001](http://localhost:3001)
- zone-admin: [http://localhost:3002](http://localhost:3002)
- backend API: [http://localhost:8080](http://localhost:8080)
- postgres: `localhost:5432` (user: `admin`, password: `devpassword`, db: `multizone`)

## Features

### Backend API Endpoints

The Go backend provides the following REST API endpoints:

- `GET /health` - Backend health check
- `GET /api/zones/status` - Health status of all Next.js zones
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/{id}` - Get a specific user
- `DELETE /api/users/{id}` - Delete a user
- `POST /api/seed` - Seed the database with sample users

### Admin Zone Features

The admin zone (`/admin`) includes:

- **Health Monitoring**: Real-time health status display for zone-main
- **User Management**: Full CRUD interface for managing users
  - Create new users with name and email
  - View all users in a list
  - Delete users with confirmation
  - Seed database with 5 sample users (Alice, Bob, Charlie, Diana, Eve)

### Database Seeding

You can seed the database in two ways:

1. **From Admin UI**: Click the "Seed Database" button in the User Management section
2. **From Tilt UI**: Trigger the `seed-database` resource (manual trigger)

Both methods add the same 5 sample users, skipping any that already exist.

## Project Structure

```
.
├── apps/
│   ├── zone-main/          # Main Next.js application (/)
│   │   ├── app/
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── zone-admin/         # Admin Next.js application (/admin)
│   │   ├── app/
│   │   │   └── components/
│   │   │       └── UserManagement.tsx  # User CRUD UI
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── README.md
│   └── backend/            # Go API backend
│       ├── main.go         # Main API server (health, CRUD endpoints)
│       ├── seed.go         # Database seeding script
│       ├── Dockerfile
│       ├── Dockerfile.seed # Seed job container
│       ├── go.mod
│       ├── go.sum
│       └── README.md
├── k8s/
│   ├── zone-main.yaml      # Deployment & Service for zone-main
│   ├── zone-admin.yaml     # Deployment & Service for zone-admin
│   ├── backend.yaml        # Deployment & Service for backend
│   ├── postgres.yaml       # StatefulSet & Service for PostgreSQL
│   ├── seed-job.yaml       # Kubernetes Job for database seeding
│   └── ingress.yaml        # Ingress for routing
├── certs/
│   ├── local.example.com.pem       # Generated locally (gitignored)
│   └── local.example.com-key.pem   # Generated locally (gitignored)
├── Tiltfile                # Tilt configuration
├── setup.sh                # Cluster setup script
├── CLAUDE.md               # AI assistant context
├── .gitignore
└── README.md
```

## Development Workflow

### Making Changes

1. Edit files in `apps/zone-main/` or `apps/zone-admin/`
2. Tilt automatically detects changes and rebuilds
3. Refresh your browser to see updates

### Viewing Logs

In the Tilt UI (press `space` after running `tilt up`):
- Click on individual resources to view logs
- Monitor build status and errors
- View pod status and restarts

### Stopping Development

```bash
# Stop Tilt (Ctrl+C in the terminal running tilt up)
# Or explicitly:
tilt down
```

### Cleanup

To completely remove the kind cluster:

```bash
kind delete cluster --name multizone-poc
```

To remove the /etc/hosts entry:

```bash
sudo sed -i '' '/local.example.com/d' /etc/hosts
```

## Multi-Zone Configuration

### zone-admin Configuration

The admin zone uses `basePath: '/admin'` in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  basePath: '/admin',
  output: 'standalone',
};
```

This ensures all routes, assets, and navigation within the admin zone are prefixed with `/admin`.

### zone-main Configuration

The main zone has no basePath (serves from root):

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
};
```

### Ingress Routing

The Ingress uses path-based routing with rewrite rules:

```yaml
paths:
  # Admin zone - must come first (more specific path)
  - path: /admin(/|$)(.*)
    pathType: ImplementationSpecific
    backend:
      service:
        name: zone-admin
        port:
          number: 80
  # Main zone - catch-all
  - path: /()(.*)
    pathType: ImplementationSpecific
    backend:
      service:
        name: zone-main
        port:
          number: 80
```

## Troubleshooting

### Port Already in Use

If ports 80 or 443 are already in use:

```bash
# Check what's using the ports
sudo lsof -i :80
sudo lsof -i :443

# Stop Docker or other services using these ports
```

### Certificate Errors

If you see certificate warnings:

```bash
# Reinstall mkcert CA
mkcert -install

# Regenerate certificates
cd certs
rm local.example.com*.pem
mkcert local.example.com
cd ..

# Recreate the kind cluster
kind delete cluster --name multizone-poc
./setup.sh
```

### Ingress Not Working

```bash
# Check ingress-nginx is running
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl get ingress

# Check ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### DNS Not Resolving

Verify `/etc/hosts` has the entry:

```bash
cat /etc/hosts | grep local.example.com
# Should show: 127.0.0.1 local.example.com
```

## What This PoC Demonstrates

- **Multi-Zone Architecture**: Multiple Next.js applications running as separate zones
- **Path-Based Routing**: Kubernetes Ingress routing requests by URL path
- **Local HTTPS**: Secure development with mkcert certificates
- **Microservices**: Separate Pod deployment per service (zones, backend, database)
- **Backend API**: Go-based REST API with health monitoring and CRUD operations
- **Database Integration**: PostgreSQL with GORM ORM for data persistence
- **User Management**: Full-stack CRUD interface in admin zone
- **Database Seeding**: Manual seeding via Tilt UI or admin interface
- **Live Reload**: Hot reload development workflow with Tilt
- **Containerization**: Docker multi-stage builds for Next.js and Go apps

## What's NOT Included (Out of Scope)

This is a PoC focused on architecture validation. The following are intentionally excluded:

- Production-ready configurations (secrets management, environment-specific configs)
- Authentication/authorization (JWT, OAuth, session management)
- Shared state management between zones (Redux, Context API across zones)
- Advanced API features (rate limiting, caching, pagination)
- CI/CD pipelines (GitHub Actions, automated testing, deployment)
- Monitoring/observability (Prometheus, Grafana, logging aggregation)
- Horizontal scaling (auto-scaling, load balancing strategies)
- Advanced routing patterns (A/B testing, feature flags)

## Next Steps

To expand this PoC:

1. Add more zones (e.g., `/dashboard`, `/api`)
2. Implement shared authentication across zones
3. Add a shared component library
4. Implement zone-to-zone navigation
5. Add environment-specific configurations
6. Implement shared session/state management

## Resources

- [Next.js Multi-Zones Documentation](https://nextjs.org/docs/pages/building-your-application/deploying/multi-zones)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [Tilt Documentation](https://docs.tilt.dev/)
- [mkcert Documentation](https://github.com/FiloSottile/mkcert)
- [ingress-nginx Documentation](https://kubernetes.github.io/ingress-nginx/)

## License

This is a proof of concept for educational and demonstration purposes.
