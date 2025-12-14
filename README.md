# Next.js Multi-Zone PoC

A Proof of Concept demonstrating a local multi-zone Next.js architecture using Kubernetes (kind), Tilt, and mkcert for local HTTPS development.

## Architecture

This PoC runs two Next.js applications as separate "zones" under a single domain:

```
local.example.com
 ├── /           → zone-main (Next.js app #1)
 └── /admin      → zone-admin (Next.js app #2)
```

Each zone runs in its own Kubernetes Pod with separate Services. An Ingress controller routes requests based on path prefixes.

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

## Project Structure

```
.
├── apps/
│   ├── zone-main/          # Main Next.js application (/)
│   │   ├── app/
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   └── package.json
│   └── zone-admin/         # Admin Next.js application (/admin)
│       ├── app/
│       ├── Dockerfile
│       ├── next.config.ts
│       └── package.json
├── k8s/
│   ├── zone-main.yaml      # Deployment & Service for zone-main
│   ├── zone-admin.yaml     # Deployment & Service for zone-admin
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

- Multiple Next.js applications running as separate zones
- Path-based routing via Kubernetes Ingress
- Local HTTPS with mkcert certificates
- Separate Pod deployment per zone
- Live reload development workflow with Tilt
- Docker containerization of Next.js apps

## What's NOT Included (Out of Scope)

This is a PoC focused on architecture validation. The following are intentionally excluded:

- Production-ready configurations
- Authentication/authorization
- Shared state management between zones
- API layer
- Database or persistent storage
- CI/CD pipelines
- Monitoring/observability
- Horizontal scaling
- Advanced routing patterns

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
