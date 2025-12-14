# backend

Go-based REST API backend for the Next.js Multi-Zone PoC.

## Overview

This is a lightweight Go HTTP server that provides health monitoring and user management APIs for the multi-zone application. It uses GORM for database interactions with PostgreSQL.

## Features

- **Health Monitoring**: Checks the health status of Next.js zones
- **User CRUD Operations**: Full Create, Read, Update, Delete for user management
- **Database Seeding**: Endpoint to populate the database with sample data
- **CORS Enabled**: Allows cross-origin requests from the Next.js zones
- **Comprehensive Comments**: Code includes detailed comments for Go beginners

## Technology Stack

- **Language**: Go 1.22
- **Web Framework**: Standard library `net/http` with pattern-based routing
- **ORM**: GORM v1.25
- **Database Driver**: PostgreSQL (pgx/v5)
- **CORS**: rs/cors package

## API Endpoints

### Health & Monitoring

- **GET /health**
  - Returns backend service health status
  - Response: `{"status":"ok","service":"backend-api"}`

- **GET /api/zones/status**
  - Checks health of all Next.js zones
  - Returns status, URL, and last check time for each zone
  - Response: `{"status":"ok","zones":[...]}`

### User Management

- **GET /api/users**
  - List all users
  - Response: Array of user objects

- **POST /api/users**
  - Create a new user
  - Request body: `{"name":"John Doe","email":"john@example.com"}`
  - Response: Created user object with ID and timestamps

- **GET /api/users/{id}**
  - Get a specific user by ID
  - Response: User object or 404 if not found

- **DELETE /api/users/{id}**
  - Delete a user by ID
  - Response: `{"message":"User deleted successfully"}`

### Database Seeding

- **POST /api/seed**
  - Seed the database with 5 sample users
  - Uses `FirstOrCreate` to avoid duplicates
  - Response: `{"message":"...","created":5,"skipped":0,...}`

## Database Schema

### User Model

```go
type User struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    Email     string    `gorm:"uniqueIndex;not null" json:"email"`
    Name      string    `gorm:"not null" json:"name"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}
```

- `email` has a unique index to prevent duplicates
- `CreatedAt` and `UpdatedAt` are managed automatically by GORM

## Configuration

### Environment Variables

- `PORT` - Server port (default: `8080`)
- `ZONE_MAIN_URL` - URL for zone-main health checks (default: `http://zone-main`)
- `ZONE_ADMIN_URL` - URL for zone-admin health checks (default: `http://zone-admin/admin`)
- `DB_HOST` - PostgreSQL host (default: `postgres`)
- `DB_PORT` - PostgreSQL port (default: `5432`)
- `DB_USER` - Database user (default: `admin`)
- `DB_PASSWORD` - Database password (default: `devpassword`)
- `DB_NAME` - Database name (default: `multizone`)

## Database Seeding

### seed.go

A standalone program that seeds the database with sample users:
- Alice Johnson (alice@example.com)
- Bob Smith (bob@example.com)
- Charlie Brown (charlie@example.com)
- Diana Prince (diana@example.com)
- Eve Anderson (eve@example.com)

Run as a Kubernetes Job:
```bash
kubectl apply -f k8s/seed-job.yaml
```

Or trigger from Tilt UI using the `seed-database` resource.

## Deployment

### Kubernetes Resources

- **Deployment**: `backend` (1 replica)
- **Service**: `backend` (ClusterIP, port 8080)
- **Port Forward**: 8080 for local development access
- **Resource Dependencies**: Waits for PostgreSQL to be ready

### Docker Images

#### Main Application (Dockerfile)
Multi-stage build:
1. **builder**: Build Go binary with `golang:1.22-alpine`
2. **runner**: Minimal Alpine image with the binary

#### Seed Job (Dockerfile.seed)
Multi-stage build for the seeding script:
1. **builder**: Build seed binary
2. **runner**: Minimal Alpine image with the seed binary

## Development

### Local Development (with Tilt)

Tilt automatically builds and deploys the backend with:
- Live reload on code changes
- Port forwarding to `localhost:8080`
- Dependency on PostgreSQL being ready

### Local Development (without Tilt)

```bash
cd apps/backend

# Install dependencies
go mod download

# Run locally (requires PostgreSQL)
export DB_HOST=localhost
export DB_USER=admin
export DB_PASSWORD=devpassword
export DB_NAME=multizone
go run main.go
```

Visit: http://localhost:8080/health

### Testing Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Zone status
curl http://localhost:8080/api/zones/status

# List users
curl http://localhost:8080/api/users

# Create user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Seed database
curl -X POST http://localhost:8080/api/seed
```

## Code Structure

### main.go

- `User` - Database model struct
- `ZoneStatus` - Health status response struct
- `HealthResponse` - Zone health response struct
- `getEnv()` - Environment variable helper
- `initDB()` - Database initialization and migration
- `checkZoneHealth()` - HTTP health check for zones
- `healthHandler()` - GET /health endpoint
- `zonesStatusHandler()` - GET /api/zones/status endpoint
- `getUsersHandler()` - GET /api/users endpoint
- `createUserHandler()` - POST /api/users endpoint
- `getUserHandler()` - GET /api/users/{id} endpoint
- `deleteUserHandler()` - DELETE /api/users/{id} endpoint
- `seedDatabaseHandler()` - POST /api/seed endpoint
- `main()` - Application entry point

### seed.go

- Standalone seeding program
- Uses same User model as main.go
- Connects to PostgreSQL and inserts sample users
- Designed to run as a Kubernetes Job

## Learn More

- [Go Documentation](https://go.dev/doc/)
- [GORM Documentation](https://gorm.io/docs/)
- [PostgreSQL with Go](https://go.dev/doc/database/)
- [Go HTTP Server](https://pkg.go.dev/net/http)
