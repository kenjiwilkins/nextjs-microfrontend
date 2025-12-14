# Testing with Docker Desktop

This guide shows how to use Docker Desktop to test and monitor your Next.js Multi-Zone PoC.

## What You Can See in Docker Desktop

Docker Desktop provides a UI to inspect and manage your containers, images, and Kubernetes resources.

### 1. View Built Images

**Location**: Docker Desktop → Images

You'll see:
- `zone-main:tilt-<hash>` - Main zone application image (~317MB)
- `zone-admin:tilt-<hash>` - Admin zone application image (~317MB)
- `kindest/node` - Kubernetes node image used by kind

**Actions**:
- Click on an image to see layers and details
- Run a container directly from an image (for testing)
- Delete unused images

### 2. View Running Containers

**Location**: Docker Desktop → Containers

When the kind cluster is running, you'll see:
- `multizone-poc-control-plane` - The kind Kubernetes cluster container
- Inside the cluster: pods running your Next.js zones

**Actions**:
- View logs for any container
- Open a terminal/exec into containers
- Start/stop containers
- View resource usage (CPU, memory)

### 3. View Kubernetes Resources (if using kind)

**Location**: Docker Desktop → Kubernetes (not directly, but via kind)

While Docker Desktop has its own Kubernetes, our PoC uses **kind** (Kubernetes in Docker), which runs as containers.

---

## Option 1: Use kind (Current Setup - Recommended)

This is what we've built. Kind creates a Kubernetes cluster that runs as Docker containers.

### Start the Cluster

```bash
# Recreate the kind cluster
./setup.sh

# Start Tilt to deploy applications
tilt up
```

### View in Docker Desktop

1. **Containers Tab**: You'll see `multizone-poc-control-plane` running
2. Click on it to:
   - View logs
   - See resource usage
   - Open a terminal inside the cluster

3. **Images Tab**: See your built zone images

### Test the Applications

- Main Zone: https://local.example.com/
- Admin Zone: https://local.example.com/admin
- Tilt UI: http://localhost:10350/

---

## Option 2: Use Docker Desktop's Built-in Kubernetes

Docker Desktop includes its own Kubernetes cluster. You can use it instead of kind.

### Enable Kubernetes in Docker Desktop

1. Open Docker Desktop
2. Go to **Settings** (gear icon)
3. Click **Kubernetes**
4. Check **Enable Kubernetes**
5. Click **Apply & Restart**

### Deploy to Docker Desktop Kubernetes

```bash
# Switch to docker-desktop context
kubectl config use-context docker-desktop

# Create TLS secret
kubectl create secret tls local-example-com-tls \
  --cert=certs/local.example.com.pem \
  --key=certs/local.example.com-key.pem

# Install ingress-nginx
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Use Tilt (it will automatically deploy to current context)
tilt up
```

### View in Docker Desktop

1. **Containers Tab**: See all your Kubernetes pods as containers
   - `zone-main-*`
   - `zone-admin-*`
   - `ingress-nginx-controller-*`

2. **Images Tab**: Your zone images

3. **Kubernetes Tab** (in some Docker Desktop versions):
   - View deployments, services, pods
   - See resource usage

### Switch Back to kind

```bash
kubectl config use-context kind-multizone-poc
```

---

## Option 3: Run Zones Directly in Docker (No Kubernetes)

Test individual zones as Docker containers without Kubernetes.

### Build and Run zone-main

```bash
# Build the image
docker build -t zone-main:test ./apps/zone-main

# Run the container
docker run -p 3000:3000 zone-main:test

# Access at http://localhost:3000
```

### Build and Run zone-admin

```bash
# Build the image
docker build -t zone-admin:test ./apps/zone-admin

# Run the container
docker run -p 3001:3000 zone-admin:test

# Access at http://localhost:3001/admin
```

### View in Docker Desktop

1. **Containers Tab**: See your running containers
   - Click **zone-main** or **zone-admin**
   - View logs in real-time
   - See resource usage
   - Open terminal to exec commands

2. **Test the applications**:
   - zone-main: http://localhost:3000/
   - zone-admin: http://localhost:3001/admin

**Note**: This tests individual zones but not the multi-zone routing via Ingress.

---

## Docker Desktop Tips

### Inspect Logs

1. Go to **Containers** tab
2. Click on a container
3. Click **Logs** to see real-time output
4. Use search to filter logs

### Execute Commands in Containers

1. Go to **Containers** tab
2. Click on a container
3. Click **Exec** or **Terminal**
4. Run commands inside the container

### Monitor Resource Usage

1. Go to **Containers** tab
2. View CPU and memory usage per container
3. Useful for identifying performance issues

### Clean Up

Remove stopped containers and unused images:

```bash
# Via Docker Desktop UI
# Containers → Select → Delete
# Images → Select → Delete

# Via CLI
docker system prune -a
```

---

## Recommendation

**For this PoC**: Use **Option 1 (kind)** as it's what we've configured.

**For learning**: Try **Option 3** to understand individual zones without Kubernetes complexity.

**For production-like testing**: Use **Option 2** (Docker Desktop's Kubernetes) as it's closer to managed Kubernetes services.

---

## Troubleshooting

### Can't see containers in Docker Desktop

- Make sure Docker Desktop is running
- Check that the kind cluster is running: `kind get clusters`
- Verify containers exist: `docker ps -a`

### Containers keep restarting

- Check logs in Docker Desktop
- Look for errors in Tilt UI
- Verify images built successfully

### Out of resources

- Increase Docker Desktop resources:
  - Settings → Resources → Adjust CPU/Memory
  - Recommended: 4 CPUs, 8GB RAM for this PoC
