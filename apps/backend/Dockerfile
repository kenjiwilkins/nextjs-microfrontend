# Multi-stage build for Go application
# Stage 1: Build the Go binary
FROM golang:1.21-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files first
# This allows Docker to cache the dependency layer
COPY go.mod go.sum* ./

# Download all dependencies
# Dependencies will be cached if go.mod and go.sum don't change
RUN go mod download

# Copy the source code
COPY . .

# Build the Go application
# CGO_ENABLED=0 creates a statically linked binary (no C dependencies)
# This makes the binary portable across different Linux distributions
RUN CGO_ENABLED=0 GOOS=linux go build -o backend main.go

# Stage 2: Create the final minimal image
FROM alpine:latest

# Install ca-certificates for HTTPS requests
# This is needed if your Go app makes external HTTPS calls
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /app/backend .

# Expose port 8080
EXPOSE 8080

# Run the binary
CMD ["./backend"]
