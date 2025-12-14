package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// This is a standalone program that seeds the database with sample users
// It can be run as a Kubernetes Job to populate test data

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

	// Ensure the users table exists
	if err := db.AutoMigrate(&User{}); err != nil {
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

	log.Printf("\n=== Seeding Complete ===")
	log.Printf("Total users processed: %d", len(sampleUsers))
	log.Printf("New users created: %d", createdCount)
	log.Printf("Existing users skipped: %d", len(sampleUsers)-createdCount)
}
