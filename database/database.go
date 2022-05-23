package database

import (
	"context"
	"log"
	"os"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	c *mongo.Client
	d *mongo.Database
)

func init() {
	if d != nil {
		return
	}
	connectionString := os.Getenv("MONGO_URI")
	if connectionString == "" {
		log.Fatal("No MongoDB connection string provided!")
	}
	var err error
	c, err = mongo.Connect(context.TODO(), options.Client().ApplyURI(connectionString))
	if err != nil {
		log.Fatalf("Error connecting to MongoDB: %v", err)
	}
	dbName := os.Getenv("MONGO_DB")
	if dbName == "" {
		log.Fatal("No MongoDB database provided!")
	}
	d = c.Database(dbName)
}

func GetDB() *mongo.Database {
	return d
}
