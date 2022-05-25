package commands

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/bwmarrin/discordgo"
	"schwa.tech/scrimbot/utils"
)

func init() {
	AddCommand(&discordgo.ApplicationCommand{
		Name:        "user",
		Description: "User commands",
		Options: []*discordgo.ApplicationCommandOption{
			{
				Name:        "info",
				Description: "Get information about a user",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					{
						Name:        "user",
						Description: "User",
						Type:        discordgo.ApplicationCommandOptionUser,
						Required:    false,
					},
				},
			},
			{
				Name:        "edit",
				Description: "Edit profile information",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					{
						Name:        "username",
						Description: "VALORANT Username",
						Type:        discordgo.ApplicationCommandOptionString,
						Required:    false,
					},
					{
						Name:        "rank",
						Description: "VALORANT Rank",
						Type:        discordgo.ApplicationCommandOptionString,
						Choices:     rankChoices,
						Required:    false,
					},
					{
						Name:        "notifications",
						Description: "Whether to recieve match notifications",
						Type:        discordgo.ApplicationCommandOptionBoolean,
						Required:    false,
					},
				},
			},
		},
	}, func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		switch i.ApplicationCommandData().Options[0].Name {
		case "info":
			options := i.ApplicationCommandData().Options[0].Options
			var user *discordgo.User
			if len(options) > 0 {
				user = options[0].UserValue(s)
			} else {
				if i.Member != nil {
					user = i.Member.User
				} else {
					user = i.User
				}
			}
			infoUserHandler(s, i, user)
		case "edit":
			editUserHandler(s, i)
		}
	})

	AddCommand(&discordgo.ApplicationCommand{
		Name: "User Info",
		Type: discordgo.UserApplicationCommand,
	}, func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		commandData := i.ApplicationCommandData()
		infoUserHandler(s, i, commandData.Resolved.Users[commandData.TargetID])
	})
}

func infoUserHandler(s *discordgo.Session, i *discordgo.InteractionCreate, discordUser *discordgo.User) {
	user, ok := utils.GetUser(discordUser.ID)
	if !ok {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "User is not registered with ScrimBot!",
			},
		})
		return
	}

	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{{
				Title: "Retrieved User Information",
				Author: &discordgo.MessageEmbedAuthor{
					Name:    fmt.Sprintf("%v#%v", discordUser.Username, discordUser.Discriminator),
					IconURL: discordUser.AvatarURL(""),
				},
				Thumbnail: &discordgo.MessageEmbedThumbnail{
					URL: discordUser.AvatarURL(""),
				},
				Fields: []*discordgo.MessageEmbedField{
					{
						Name:   "Valorant Username",
						Value:  user.ValorantUsername,
						Inline: true,
					},
					{
						Name:   "Valorant Rank",
						Value:  utils.RankIDToName(user.ValorantRank),
						Inline: true,
					},
					{
						Name:   "Registration Date",
						Value:  user.Timestamp.Format(time.RFC1123),
						Inline: false,
					},
					{
						Name:   "Notifications Enabled",
						Value:  strconv.FormatBool(user.Notifications),
						Inline: true,
					},
					{
						Name:   "Matches Played",
						Value:  strconv.Itoa(len(user.Matches)),
						Inline: true,
					},
				},
			}},
		},
	})
	if err != nil {
		log.Println(err)
	}
}

func editUserHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "start match",
		},
	})

	if err != nil {
		log.Println(err)
	}
}
