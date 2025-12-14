# Tiltfile for Next.js Multi-Zone PoC

# Build zone-main Docker image
docker_build(
  'zone-main',
  context='./apps/zone-main',
  dockerfile='./apps/zone-main/Dockerfile',
  live_update=[
    # Sync source files for faster development
    sync('./apps/zone-main', '/app'),
    # Exclude node_modules and .next to prevent conflicts
    sync('./apps/zone-main/node_modules', '/app/node_modules'),
  ]
)

# Build zone-admin Docker image
docker_build(
  'zone-admin',
  context='./apps/zone-admin',
  dockerfile='./apps/zone-admin/Dockerfile',
  live_update=[
    # Sync source files for faster development
    sync('./apps/zone-admin', '/app'),
    # Exclude node_modules and .next to prevent conflicts
    sync('./apps/zone-admin/node_modules', '/app/node_modules'),
  ]
)

# Deploy zone-main
k8s_yaml('./k8s/zone-main.yaml')
k8s_resource(
  'zone-main',
  port_forwards='3001:3000',
  labels=['zones']
)

# Deploy zone-admin
k8s_yaml('./k8s/zone-admin.yaml')
k8s_resource(
  'zone-admin',
  port_forwards='3002:3000',
  labels=['zones']
)

# Build backend Docker image (Go application)
docker_build(
  'backend',
  context='./apps/backend',
  dockerfile='./apps/backend/Dockerfile'
)

# Deploy backend
k8s_yaml('./k8s/backend.yaml')
k8s_resource(
  'backend',
  port_forwards='8080:8080',
  labels=['backend']
)

# Deploy ingress
k8s_yaml('./k8s/ingress.yaml')

# Print helpful message
print("""
╔══════════════════════════════════════════════════════════════╗
║  Next.js Multi-Zone PoC is running!                         ║
╠══════════════════════════════════════════════════════════════╣
║  Main Zone:    https://local.example.com/                   ║
║  Admin Zone:   https://local.example.com/admin              ║
╠══════════════════════════════════════════════════════════════╣
║  Direct Access (for debugging):                             ║
║  zone-main:    http://localhost:3001                        ║
║  zone-admin:   http://localhost:3002                        ║
║  backend-api:  http://localhost:8080                        ║
╚══════════════════════════════════════════════════════════════╝
""")
