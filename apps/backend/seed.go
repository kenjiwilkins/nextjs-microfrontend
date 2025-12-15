//go:build seed
// +build seed

package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// User represents a user in the database
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// FeatureFlag represents a feature flag in the database
type FeatureFlag struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Key         string    `gorm:"uniqueIndex;not null" json:"key"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Enabled     bool      `gorm:"default:false;not null" json:"enabled"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// This is a standalone program that seeds the database with sample users and feature flags
// It can be run as a Kubernetes Job to populate test data

// getEnv retrieves an environment variable or returns a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	log.Println("=== Database Seeder ===")

	// Build PostgreSQL connection string from environment variables
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		getEnv("DB_HOST", "postgres"),
		getEnv("DB_USER", "admin"),
		getEnv("DB_PASSWORD", "devpassword"),
		getEnv("DB_NAME", "multizone"),
		getEnv("DB_PORT", "5432"),
	)

	// Connect to the database
	log.Printf("Connecting to database at %s...", getEnv("DB_HOST", "postgres"))
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	// Ensure the database tables exist
	if err := db.AutoMigrate(&User{}, &FeatureFlag{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database schema migrated")

	// Sample users to seed
	sampleUsers := []User{
		{
			Email: "alice@example.com",
			Name:  "Alice Johnson",
		},
		{
			Email: "bob@example.com",
			Name:  "Bob Smith",
		},
		{
			Email: "charlie@example.com",
			Name:  "Charlie Brown",
		},
		{
			Email: "diana@example.com",
			Name:  "Diana Prince",
		},
		{
			Email: "eve@example.com",
			Name:  "Eve Anderson",
		},
	}

	// Insert sample users
	// Using FirstOrCreate to avoid duplicates (won't insert if email already exists)
	log.Printf("Seeding %d users...", len(sampleUsers))

	createdCount := 0
	for _, user := range sampleUsers {
		var existingUser User
		result := db.Where("email = ?", user.Email).FirstOrCreate(&existingUser, user)

		if result.Error != nil {
			log.Printf("Error creating user %s: %v", user.Email, result.Error)
			continue
		}

		// Check if a new record was created (RowsAffected > 0 means it was created, not found)
		if result.RowsAffected > 0 {
			createdCount++
			log.Printf("✓ Created user: %s (%s)", user.Name, user.Email)
		} else {
			log.Printf("- Skipped (already exists): %s (%s)", user.Name, user.Email)
		}
	}

	log.Printf("\n=== User Seeding Complete ===")
	log.Printf("Total users processed: %d", len(sampleUsers))
	log.Printf("New users created: %d", createdCount)
	log.Printf("Existing users skipped: %d", len(sampleUsers)-createdCount)

	// Sample feature flags to seed
	sampleFlags := []FeatureFlag{
		{
			Key:         "show_welcome_banner",
			Name:        "Show Welcome Banner",
			Description: "Displays a welcome banner on the main page",
			Enabled:     false, // Start disabled
		},
		{
			Key:         "new_user_dashboard",
			Name:        "New User Dashboard",
			Description: "Enable the redesigned user dashboard interface",
			Enabled:     false,
		},
		{
			Key:         "beta_features",
			Name:        "Beta Features",
			Description: "Enable access to beta features for testing",
			Enabled:     false,
		},
	}

	// Insert sample feature flags
	// Using FirstOrCreate to avoid duplicates (won't insert if key already exists)
	log.Printf("\n\nSeeding %d feature flags...", len(sampleFlags))

	createdFlagCount := 0
	for _, flag := range sampleFlags {
		var existingFlag FeatureFlag
		result := db.Where("key = ?", flag.Key).FirstOrCreate(&existingFlag, flag)

		if result.Error != nil {
			log.Printf("Error creating feature flag %s: %v", flag.Key, result.Error)
			continue
		}

		// Check if a new record was created (RowsAffected > 0 means it was created, not found)
		if result.RowsAffected > 0 {
			createdFlagCount++
			log.Printf("✓ Created feature flag: %s (%s)", flag.Name, flag.Key)
		} else {
			log.Printf("- Skipped (already exists): %s (%s)", flag.Name, flag.Key)
		}
	}

	log.Printf("\n=== Feature Flag Seeding Complete ===")
	log.Printf("Total feature flags processed: %d", len(sampleFlags))
	log.Printf("New flags created: %d", createdFlagCount)
	log.Printf("Existing flags skipped: %d", len(sampleFlags)-createdFlagCount)

	log.Println("\n\n=== ALL SEEDING COMPLETE ===")
}
