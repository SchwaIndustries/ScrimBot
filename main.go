package main

import (
	"context"
	"log"
	"os"
	"os/signal"

	"github.com/bwmarrin/discordgo"
	_ "github.com/joho/godotenv/autoload"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"scrimbot.schwa.tech/commands"
)

var (
	s  *discordgo.Session
	db *mongo.Database
)

func init() {
	token := os.Getenv("TOKEN")
	if token == "" {
		log.Fatal("No Discord bot token provided!")
	}
	var err error
	s, err = discordgo.New("Bot " + token)
	if err != nil {
		log.Fatalf("Error connecting to Discord: %v", err)
	}
}

func init() {
	connectionString := os.Getenv("MONGO_URI")
	if connectionString == "" {
		log.Fatal("No MongoDB connection string provided!")
	}
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(connectionString))
	if err != nil {
		log.Fatalf("Error connecting to MongoDB: %v", err)
	}
	dbName := os.Getenv("MONGO_DB")
	if dbName == "" {
		log.Fatal("No MongoDB database provided!")
	}
	db = client.Database(dbName)
}

func main() {
	defer func() {
		if err := db.Client().Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	s.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Printf("Logged in as: %v#%v", s.State.User.Username, s.State.User.Discriminator)
	})
	err := s.Open()
	if err != nil {
		log.Fatalf("Cannot open the session: %v", err)
	}

	log.Println("Adding commands...")
	for _, v := range commands.CommandDatas {
		_, err := s.ApplicationCommandCreate(s.State.User.ID, "", v)
		if err != nil {
			log.Panicf("Cannot create '%v' command: %v", v.Name, err)
		}
	}

	s.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		if h, ok := commands.Handlers[i.ApplicationCommandData().Name]; ok {
			h(s, i)
		}
	})

	defer s.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Println("Shutting down...")
}
