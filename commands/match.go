package commands

import (
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
		options := i.ApplicationCommandData().Options
		content := ""

		switch options[0].Name {
		case "create":
			content = "create match"
		case "start":
			content = "start match"
		case "cancel":
			content = "cancel match"
		case "score":
			content = "score match"
		case "edit":
			content = "edit match"
		case "info":
			content = "info match"
		case "refresh":
			content = "refresh match"
		}

		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: content,
			},
		})
	})
}
