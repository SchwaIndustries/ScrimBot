package commands

import (
	"log"

	"github.com/bwmarrin/discordgo"
)

func init() {
	matchIdOption := discordgo.ApplicationCommandOption{
		Name:        "id",
		Description: "Match ID",
		Type:        discordgo.ApplicationCommandOptionInteger,
		MinValue:    &zero,
		Required:    true,
	}
	one := 1.0

	AddCommand(&discordgo.ApplicationCommand{
		Name:        "match",
		Description: "Match commands",
		Options: []*discordgo.ApplicationCommandOption{
			{
				Name:        "create",
				Description: "Create a new match",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					{
						Name:        "date",
						Description: "Date & Time of Match",
						Type:        discordgo.ApplicationCommandOptionString,
						Required:    true,
					},
					{
						Name:        "playercount",
						Description: "Number of players on each team",
						Type:        discordgo.ApplicationCommandOptionInteger,
						MinValue:    &one,
						MaxValue:    5,
						Required:    true,
					},
					{
						Name:        "spectators",
						Description: "Whether to allow spectators in the match",
						Type:        discordgo.ApplicationCommandOptionBoolean,
						Required:    true,
					},
					{
						Name:        "map",
						Description: "Map for the match",
						Type:        discordgo.ApplicationCommandOptionString,
						Choices:     mapChoices,
						Required:    true,
					},
					{
						Name:        "mode",
						Description: "Game mode for the match",
						Type:        discordgo.ApplicationCommandOptionString,
						Choices:     gameModeChoices,
						Required:    true,
					},
					{
						Name:        "rankmin",
						Description: "Minimum rank allowed in the match",
						Type:        discordgo.ApplicationCommandOptionString,
						Choices:     rankChoices,
						Required:    false,
					},
					{
						Name:        "rankmax",
						Description: "Maximum rank allowed in the match",
						Type:        discordgo.ApplicationCommandOptionString,
						Choices:     rankChoices,
						Required:    false,
					},
				},
			},
			{
				Name:        "start",
				Description: "Start a match",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					&matchIdOption,
				},
			},
			{
				Name:        "cancel",
				Description: "Cancel a match",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					&matchIdOption,
				},
			},
			{
				Name:        "score",
				Description: "Add the score to a finished match",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					&matchIdOption,
					{
						Name:        "teama",
						Description: "Team A's score",
						Type:        discordgo.ApplicationCommandOptionInteger,
						MinValue:    &zero,
						Required:    true,
					},
					{
						Name:        "teamb",
						Description: "Team B's score",
						Type:        discordgo.ApplicationCommandOptionInteger,
						MinValue:    &zero,
						Required:    true,
					},
				},
			},
			{
				Name:        "edit",
				Description: "Edit match details",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					&matchIdOption,
				},
			},
			{
				Name:        "info",
				Description: "Get information about a match",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					&matchIdOption,
				},
			},
			{
				Name:        "refresh",
				Description: "Refresh a match info message",
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Options: []*discordgo.ApplicationCommandOption{
					&matchIdOption,
				},
			},
		},
	}, func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		switch i.ApplicationCommandData().Options[0].Name {
		case "create":
			createMatchHandler(s, i)
		case "start":
			startMatchHandler(s, i)
		case "cancel":
			cancelMatchHandler(s, i)
		case "score":
			scoreMatchHandler(s, i)
		case "edit":
			editMatchHandler(s, i)
		case "info":
			infoMatchHandler(s, i)
		case "refresh":
			refreshMatchHandler(s, i)
		}
	})

	AddComponentHandler("join-teama", func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseUpdateMessage,
		})
	})
	AddComponentHandler("join-teamb", func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseUpdateMessage,
		})
	})
	AddComponentHandler("join-spectators", func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseUpdateMessage,
		})
	})
}

func createMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{
				{
					Title:       "Match Details",
					Description: "match",
					Fields: []*discordgo.MessageEmbedField{
						{
							Name:   "Team A",
							Value:  "None",
							Inline: true,
						},
						{
							Name:   "Team B",
							Value:  "None",
							Inline: true,
						},
						{
							Name:   "Spectators",
							Value:  "None",
							Inline: true,
						},
					},
				},
			},
			Components: []discordgo.MessageComponent{
				discordgo.ActionsRow{
					Components: []discordgo.MessageComponent{
						discordgo.Button{
							Label:    "Join Team A",
							CustomID: "join-teama",
						},
						discordgo.Button{
							Label:    "Join Team B",
							CustomID: "join-teamb",
						},
						discordgo.Button{
							Label:    "Join Spectators",
							CustomID: "join-spectators",
						},
					},
				},
			},
		},
	})

	if err != nil {
		log.Println(err)
	}
}

func startMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
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

func cancelMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "cancel match",
		},
	})

	if err != nil {
		log.Println(err)
	}
}

func scoreMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "score match",
		},
	})

	if err != nil {
		log.Println(err)
	}
}

func editMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "edit match",
		},
	})

	if err != nil {
		log.Println(err)
	}
}

func infoMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "info match",
		},
	})

	if err != nil {
		log.Println(err)
	}
}

// TODO: convert this to a message component action, not a slash command
func refreshMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "refresh match",
		},
	})

	if err != nil {
		log.Println(err)
	}
}
