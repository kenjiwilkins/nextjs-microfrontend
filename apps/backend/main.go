package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/rs/cors"
)

// ZoneStatus represents the health status of a single zone (Next.js app)
// This struct will be converted to JSON when sent to clients
type ZoneStatus struct {
	Name      string    `json:"name"`      // Name of the zone (e.g., "zone-main")
	Status    string    `json:"status"`    // Health status: "healthy", "unhealthy", or "degraded"
	URL       string    `json:"url"`       // URL that was checked
	LastCheck time.Time `json:"lastCheck"` // When we last checked this zone
	Message   string    `json:"message"`   // Human-readable message about the status
}

// HealthResponse is the JSON structure returned by /api/zones/status
// Contains overall status and array of individual zone statuses
type HealthResponse struct {
	Status string       `json:"status"` // Overall API status
	Zones  []ZoneStatus `json:"zones"`  // Array of zone health statuses
}

// Global variables to store zone URLs
// These are INTERNAL Kubernetes service URLs (pod-to-pod communication)
// NOT the external URLs you use in your browser
//
// zone-main: http://zone-main (service name, no basePath)
// zone-admin: http://zone-admin/admin (service name + basePath)
//
// Note: External browser URLs are different (https://local.example.com/)
var (
	zoneMainURL  = getEnv("ZONE_MAIN_URL", "http://zone-main")
	zoneAdminURL = getEnv("ZONE_ADMIN_URL", "http://zone-admin/admin")
)

// getEnv retrieves an environment variable or returns a fallback value
// This is useful for configuration that changes between environments
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// checkZoneHealth performs an HTTP health check on a zone
// It returns a ZoneStatus indicating whether the zone is responding
func checkZoneHealth(name, url string) ZoneStatus {
	// Create a status object with basic info
	status := ZoneStatus{
		Name:      name,
		URL:       url,
		LastCheck: time.Now(),
	}

	// Create an HTTP client with a timeout
	// This prevents hanging if a zone is unresponsive
	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	// Try to make a GET request to the zone
	resp, err := client.Get(url)
	if err != nil {
		// If we can't connect, mark as unhealthy
		status.Status = "unhealthy"
		status.Message = fmt.Sprintf("Connection failed: %v", err)
		return status
	}
	defer resp.Body.Close() // Always close the response body

	// Check the HTTP status code
	if resp.StatusCode == http.StatusOK {
		status.Status = "healthy"
		status.Message = "Zone is responding"
	} else {
		// Got a response but not 200 OK
		status.Status = "degraded"
		status.Message = fmt.Sprintf("HTTP %d", resp.StatusCode)
	}

	return status
}

// healthHandler responds to /health endpoint
// This is a simple endpoint to check if the backend itself is running
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "backend-api",
	})
}

// zonesStatusHandler responds to /api/zones/status endpoint
// This endpoint checks the health of all zones and returns their status
// The admin zone will call this endpoint to display health information
func zonesStatusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check health of both zones by making HTTP requests to them
	// These are internal Kubernetes service-to-service calls
	mainStatus := checkZoneHealth("zone-main", zoneMainURL)
	adminStatus := checkZoneHealth("zone-admin", zoneAdminURL)

	// Build the response with all zone statuses
	response := HealthResponse{
		Status: "ok",
		Zones: []ZoneStatus{
			mainStatus,
			adminStatus,
		},
	}

	// Encode the response as JSON and send it to the client
	json.NewEncoder(w).Encode(response)
}

// main is the entry point of the application
func main() {
	// Create a new HTTP request multiplexer (router)
	// Think of this as a map of URL paths to handler functions
	mux := http.NewServeMux()

	// Register our HTTP route handlers
	// When someone visits /health, call healthHandler
	mux.HandleFunc("/health", healthHandler)
	// When someone visits /api/zones/status, call zonesStatusHandler
	mux.HandleFunc("/api/zones/status", zonesStatusHandler)

	// Enable CORS (Cross-Origin Resource Sharing)
	// This allows the Next.js admin frontend to make API calls to this backend
	// Without CORS, browsers would block requests from different origins
	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Allow requests from any origin (in production, specify exact origins)
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
	}).Handler(mux)

	// Get the port from environment variable or use 8080 as default
	port := getEnv("PORT", "8080")
	addr := fmt.Sprintf(":%s", port)

	// Log startup information so we can see it in kubectl logs
	log.Printf("Backend API server starting on %s", addr)
	log.Printf("Monitoring zones:")
	log.Printf("  - Main:  %s", zoneMainURL)
	log.Printf("  - Admin: %s", zoneAdminURL)

	// Start the HTTP server
	// This is a blocking call - the program will run until terminated
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}
