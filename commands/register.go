package commands

import (
	"context"
	"log"
	"time"

	"github.com/bwmarrin/discordgo"
	"schwa.tech/scrimbot/database"
	"schwa.tech/scrimbot/utils"
)

func init() {
	AddCommand(&discordgo.ApplicationCommand{
		Name:        "register",
		Description: "Register with ScrimBot",
		Options: []*discordgo.ApplicationCommandOption{
			{
				Name:        "username",
				Description: "VALORANT Username",
				Type:        discordgo.ApplicationCommandOptionString,
				Required:    true,
			},
			{
				Name:        "rank",
				Description: "VALORANT Rank",
				Type:        discordgo.ApplicationCommandOptionString,
				Choices:     rankChoices,
				Required:    true,
			},
			{
				Name:        "notifications",
				Description: "Whether to recieve match notifications",
				Type:        discordgo.ApplicationCommandOptionBoolean,
				Required:    true,
			},
		},
	}, func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		user := i.User
		if user == nil {
			// If used in guild instead of DM
			user = i.Member.User
		}

		if utils.UserIsRegistered(user.ID) {
			err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Content: "You are already registered with ScrimBot! If you would like to modify your profile, use `/user edit`.",
				},
			})
			if err != nil {
				log.Println(err)
			}
			return
		}

		interactionData := i.ApplicationCommandData()
		userData := database.User{
			ID:        user.ID,
			DiscordID: user.ID,
			Matches:   make([]string, 0),
			Timestamp: time.Now(),
		}

		for _, option := range interactionData.Options[0].Options {
			switch option.Name {
			case "username":
				userData.ValorantUsername = option.StringValue()
			case "rank":
				userData.ValorantRank = utils.RankNameToID(option.StringValue())
			case "notifications":
				userData.Notifications = option.BoolValue()
			}
		}

		_, err := database.GetDB().Collection("users").InsertOne(context.Background(), userData)
		if err != nil {
			log.Println(err)
		}

		err = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "ScrimBot registration is complete! Now it's time to get playing!",
			},
		})
		if err != nil {
			log.Println(err)
		}
	})
}
