package models

import (
	"time"
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

// FeatureFlag represents a feature flag in the database
// Feature flags allow dynamic control of features without code deployments
type FeatureFlag struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Key         string    `gorm:"uniqueIndex;not null" json:"key"`         // Unique identifier (e.g., "new_dashboard")
	Name        string    `gorm:"not null" json:"name"`                    // Human-readable name
	Description string    `gorm:"type:text" json:"description"`            // What this flag controls
	Enabled     bool      `gorm:"default:false;not null" json:"enabled"`   // Current state (true/false)
	CreatedAt   time.Time `json:"createdAt"`                               // GORM automatically manages this
	UpdatedAt   time.Time `json:"updatedAt"`                               // GORM automatically manages this
}
