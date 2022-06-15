package utils

import (
	"context"
	"log"
	"strings"

	"github.com/bwmarrin/discordgo"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"schwa.tech/scrimbot/database"
)

func GetUser(id string) (database.User, bool) {
	var result database.User
	err := database.GetDB().Collection("users").FindOne(context.Background(), bson.M{
		"_id": id,
	}).Decode(&result)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return result, false
		} else {
			log.Println(err)
		}
	}

	return result, true
}

func UserIsRegistered(id string) bool {
	var result bson.M
	err := database.GetDB().Collection("users").FindOne(context.Background(), bson.M{
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

func UserIsAdmin(id string) bool {
	var result bson.M
	err := database.GetDB().Collection("users").FindOne(context.Background(), bson.M{
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

func GetMatch(id string) (database.Match, bool) {
	var result database.Match
	err := database.GetDB().Collection("matches").FindOne(context.Background(), bson.M{
		"_id": id,
	}).Decode(&result)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return result, false
		} else {
			log.Println(err)
		}
	}

	return result, true
}

func UpdateDocument(id string, collection string, data *bson.M) bool {
	result, err := database.GetDB().Collection(collection).UpdateOne(context.Background(), bson.M{
		"_id": id,
	}, data)

	if err != nil {
		log.Println(err)
		return false
	}

	if result.MatchedCount == 0 {
		return false
	}

	return true
}

func InteractionRespond(s *discordgo.Session, i *discordgo.InteractionCreate, content string, ephemeral bool) {
	responseData := &discordgo.InteractionResponseData{
		Content: content,
	}

	if ephemeral {
		responseData.Flags = uint64(discordgo.MessageFlagsEphemeral)
	}

	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: responseData,
	})
	if err != nil {
		log.Println(err)
	}
}

func InteractionRespondEmpty(s *discordgo.Session, i *discordgo.InteractionCreate) {
	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseUpdateMessage,
	})
}

func CapitalizeFirstLetter(str string) string {
	str = strings.ToLower(str)
	return strings.ToUpper((string)(str[0])) + (string)(str[1:])
}

func MapThumbnailURL(name string) string {
	switch strings.ToLower(name) {
	case "split":
		return "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt2caea7a88362d6aa/5ecd64b0817e574fa1dcc162/split-minimap-2.png"
	case "bind":
		return "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltad4274632c983531/5ecd64d04d187c101f3f2486/bind-minimap-2.png"
	case "haven":
		return "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltedb5d57941e4f3f5/5ecd64c14d187c101f3f2484/haven-minimap-2.png"
	case "ascent":
		return "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt47bef6aa9e43d8ec/5ecd64df96a8996de38bbf8f/ascent-minimap-2.jpg"
	case "icebox":
		return "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt727aeefa1875f8ce/5fc9954afd99385ff600b0f6/Icebox_1a.jpg"
	case "breeze":
		return "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt1aa82531c6b3a04b/607fa05b33cf413db790d632/breeze_1a.jpg"
	case "fracture":
		return "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt6145fdc7dffa2f5f/6131c5e985514a6ee3fac889/Fracture_Map_Website_Asset.jpg"
	default:
		return ""
	}
}

func RankNameToID(name string) database.Rank {
	return 0
}

func RankIDToName(id database.Rank) string {
	return "rank"
}

func Substr(input string, start int, length int) string {
	asRunes := []rune(input)

	if start >= len(asRunes) {
		return ""
	}

	if start+length > len(asRunes) {
		length = len(asRunes) - start
	}

	return string(asRunes[start : start+length])
}
