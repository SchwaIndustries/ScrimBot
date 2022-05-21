package utils

import (
	"context"
	"log"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func UserIsRegistered(db *mongo.Database, id string) bool {
	var result bson.M
	err := db.Collection("users").FindOne(context.TODO(), bson.M{
		"_id": id,
	}).Decode(&result)

	if err != nil {
		if err != mongo.ErrNoDocuments {
			log.Println(err)
		}
		return false
	}

	return true
}

func UserIsAdmin(db *mongo.Database, id string) bool {
	var result bson.M
	err := db.Collection("users").FindOne(context.TODO(), bson.M{
		"_id":   id,
		"admin": true,
	}).Decode(&result)

	if err != nil {
		if err != mongo.ErrNoDocuments {
			log.Println(err)
		}
		return false
	}

	return true
}

func CapitalizeFirstLetter(str string) string {
	str = strings.ToLower(str)
	return strings.ToUpper((string)(str[0])) + (string)(str[1:])
}
