#!/bin/bash

# Next.js Multi-Zone PoC Setup Script
# This script sets up a kind cluster with ingress-nginx and TLS certificates

set -e

echo "=========================================="
echo "Next.js Multi-Zone PoC Setup"
echo "=========================================="
echo ""

# Check if kind is installed
if ! command -v kind &> /dev/null; then
    echo "Error: kind is not installed."
    echo "Please install kind: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed."
    echo "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Check if mkcert certificates exist
if [ ! -f "certs/local.example.com.pem" ] || [ ! -f "certs/local.example.com-key.pem" ]; then
    echo "Error: mkcert certificates not found in certs/ directory."
    echo "Please run: cd certs && mkcert local.example.com"
    exit 1
fi

echo "Step 1: Creating kind cluster..."
kind create cluster --name multizone-poc --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF

echo ""
echo "Step 2: Installing ingress-nginx..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo ""
echo "Step 3: Waiting for ingress-nginx to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

echo ""
echo "Step 4: Creating TLS secret from mkcert certificates..."
kubectl create secret tls local-example-com-tls \
  --cert=certs/local.example.com.pem \
  --key=certs/local.example.com-key.pem

echo ""
echo "Step 5: Adding local.example.com to /etc/hosts..."
if grep -q "local.example.com" /etc/hosts; then
    echo "Entry already exists in /etc/hosts"
else
    echo "Adding entry to /etc/hosts (requires sudo)..."
    echo "127.0.0.1 local.example.com" | sudo tee -a /etc/hosts
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your kind cluster is ready. To start the application:"
echo "  1. Run: tilt up"
echo "  2. Access the app at:"
echo "     - Main Zone:  https://local.example.com/"
echo "     - Admin Zone: https://local.example.com/admin"
echo ""
echo "To tear down the cluster:"
echo "  kind delete cluster --name multizone-poc"
echo ""
