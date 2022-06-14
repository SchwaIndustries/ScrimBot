package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"

	"github.com/bwmarrin/discordgo"
	_ "github.com/joho/godotenv/autoload"
	"go.mongodb.org/mongo-driver/mongo"
	"schwa.tech/scrimbot/commands"
	"schwa.tech/scrimbot/database"
)

var (
	s              *discordgo.Session
	db             *mongo.Database
	updateCommands = flag.Bool("updatecommands", false, "Update application commands on Discord")
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
	db = database.GetDB()
}

func main() {
	flag.Parse()

	defer func() {
		if err := db.Client().Disconnect(context.Background()); err != nil {
			panic(err)
		}
	}()

	s.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Printf("Logged in as: %v#%v", s.State.User.Username, s.State.User.Discriminator)
		err := s.UpdateStatusComplex(discordgo.UpdateStatusData{
			Activities: []*discordgo.Activity{
				{
					Type: discordgo.ActivityTypeWatching,
					Name: "for matches",
					URL:  "",
				},
			},
			Status: "online",
		})
		if err != nil {
			log.Println(err)
		}
	})
	err := s.Open()
	if err != nil {
		log.Fatalf("Cannot open the session: %v", err)
	}

	if *updateCommands {
		log.Println("Updating commands...")
		for _, v := range commands.CommandDatas {
			_, err := s.ApplicationCommandCreate(s.State.User.ID, "", v)
			if err != nil {
				log.Panicf("Cannot create '%v' command: %v", v.Name, err)
			}
		}
	}

	s.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		switch i.Type {
		case discordgo.InteractionApplicationCommand:
			if h, ok := commands.CommandHandlers[i.ApplicationCommandData().Name]; ok {
				h(s, i)
			}
		case discordgo.InteractionMessageComponent:
			if h, ok := commands.ComponentHandlers[i.MessageComponentData().CustomID]; ok {
				h(s, i)
			}
		}
	})

	defer s.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Println("Shutting down...")
}
