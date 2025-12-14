package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/rs/cors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// User represents a user in the database
// GORM will automatically create a table called "users" from this struct
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"` // Unique email addresses
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `json:"createdAt"` // GORM automatically manages this
	UpdatedAt time.Time `json:"updatedAt"` // GORM automatically manages this
}

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

// Global variables
var (
	// Database connection (will be initialized in main)
	db *gorm.DB

	// Zone URLs for health checks
	// These are INTERNAL Kubernetes service URLs (pod-to-pod communication)
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

// initDB initializes the database connection and runs migrations
// It connects to PostgreSQL and creates/updates the database schema
func initDB() (*gorm.DB, error) {
	// Build PostgreSQL connection string
	// Format: "host=localhost user=admin password=secret dbname=mydb port=5432"
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		getEnv("DB_HOST", "postgres"),
		getEnv("DB_USER", "admin"),
		getEnv("DB_PASSWORD", "devpassword"),
		getEnv("DB_NAME", "multizone"),
		getEnv("DB_PORT", "5432"),
	)

	// Open connection to PostgreSQL
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate the User model
	// This will create the "users" table if it doesn't exist
	// If the table exists, it will update it (add new columns, but won't delete existing ones)
	if err := database.AutoMigrate(&User{}); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database connected and migrated successfully")
	return database, nil
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
func zonesStatusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check health of both zones by making HTTP requests to them
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

// getUsersHandler responds to GET /api/users
// Returns a list of all users in the database
func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var users []User
	// Find all users in the database
	// GORM will execute: SELECT * FROM users
	if err := db.Find(&users).Error; err != nil {
		// If there's an error, return HTTP 500
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}

	// Return the users as JSON
	json.NewEncoder(w).Encode(users)
}

// createUserHandler responds to POST /api/users
// Creates a new user in the database
func createUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Parse the JSON request body into a User struct
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if user.Email == "" || user.Name == "" {
		http.Error(w, "Email and name are required", http.StatusBadRequest)
		return
	}

	// Create the user in the database
	// GORM will execute: INSERT INTO users (email, name, created_at, updated_at) VALUES (...)
	if err := db.Create(&user).Error; err != nil {
		// Check if it's a duplicate email error
		http.Error(w, fmt.Sprintf("Failed to create user: %v", err), http.StatusInternalServerError)
		return
	}

	// Return the created user (with ID and timestamps populated)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// getUserHandler responds to GET /api/users/:id
// Returns a single user by ID
func getUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Extract ID from URL path
	// Simple approach: parse the last segment of the path
	id := r.PathValue("id")

	var user User
	// Find user by ID
	// GORM will execute: SELECT * FROM users WHERE id = ?
	if err := db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		}
		return
	}

	json.NewEncoder(w).Encode(user)
}

// deleteUserHandler responds to DELETE /api/users/:id
// Deletes a user by ID
func deleteUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Extract ID from URL path
	id := r.PathValue("id")

	// Delete the user
	// GORM will execute: DELETE FROM users WHERE id = ?
	result := db.Delete(&User{}, id)
	if result.Error != nil {
		http.Error(w, fmt.Sprintf("Database error: %v", result.Error), http.StatusInternalServerError)
		return
	}

	// Check if any rows were affected
	if result.RowsAffected == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Return success message
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User deleted successfully",
	})
}

// seedDatabaseHandler responds to POST /api/seed
// Seeds the database with sample user data (same data as the seed job)
func seedDatabaseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Sample users to seed (same as in seed.go)
	sampleUsers := []User{
		{Email: "alice@example.com", Name: "Alice Johnson"},
		{Email: "bob@example.com", Name: "Bob Smith"},
		{Email: "charlie@example.com", Name: "Charlie Brown"},
		{Email: "diana@example.com", Name: "Diana Prince"},
		{Email: "eve@example.com", Name: "Eve Anderson"},
	}

	createdCount := 0
	skippedCount := 0
	errors := []string{}

	// Insert sample users using FirstOrCreate to avoid duplicates
	for _, user := range sampleUsers {
		var existingUser User
		result := db.Where("email = ?", user.Email).FirstOrCreate(&existingUser, user)

		if result.Error != nil {
			errors = append(errors, fmt.Sprintf("Error creating user %s: %v", user.Email, result.Error))
			continue
		}

		// Check if a new record was created (RowsAffected > 0 means created, not found)
		if result.RowsAffected > 0 {
			createdCount++
		} else {
			skippedCount++
		}
	}

	// Build response
	response := map[string]interface{}{
		"message":       "Database seeding completed",
		"totalUsers":    len(sampleUsers),
		"created":       createdCount,
		"skipped":       skippedCount,
		"errors":        errors,
		"errorCount":    len(errors),
	}

	// Return appropriate status code
	if len(errors) > 0 && createdCount == 0 {
		w.WriteHeader(http.StatusInternalServerError)
	} else {
		w.WriteHeader(http.StatusOK)
	}

	json.NewEncoder(w).Encode(response)
}

// main is the entry point of the application
func main() {
	// Initialize database connection
	var err error
	db, err = initDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	log.Println("Database initialized successfully")

	// Create a new HTTP request multiplexer (router)
	mux := http.NewServeMux()

	// Register route handlers
	// Health check endpoints
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/zones/status", zonesStatusHandler)

	// User management endpoints
	mux.HandleFunc("GET /api/users", getUsersHandler)           // List all users
	mux.HandleFunc("POST /api/users", createUserHandler)        // Create new user
	mux.HandleFunc("GET /api/users/{id}", getUserHandler)       // Get single user
	mux.HandleFunc("DELETE /api/users/{id}", deleteUserHandler) // Delete user

	// Database seeding endpoint
	mux.HandleFunc("POST /api/seed", seedDatabaseHandler)       // Seed database with sample data

	// Enable CORS (Cross-Origin Resource Sharing)
	// This allows the Next.js admin frontend to make API calls to this backend
	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Allow requests from any origin (in production, specify exact origins)
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
	}).Handler(mux)

	// Get the port from environment variable or use 8080 as default
	port := getEnv("PORT", "8080")
	addr := fmt.Sprintf(":%s", port)

	// Log startup information
	log.Printf("Backend API server starting on %s", addr)
	log.Printf("Monitoring zones:")
	log.Printf("  - Main:  %s", zoneMainURL)
	log.Printf("  - Admin: %s", zoneAdminURL)
	log.Printf("Database connection: postgres@%s", getEnv("DB_HOST", "postgres"))

	// Start the HTTP server
	// This is a blocking call - the program will run until terminated
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}
