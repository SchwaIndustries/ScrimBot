package commands

import "github.com/bwmarrin/discordgo"

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
						Name:        "id",
						Description: "User ID",
						Type:        discordgo.ApplicationCommandOptionInteger,
						MinValue:    &zero,
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
						Choices: []*discordgo.ApplicationCommandOptionChoice{
							{
								Name:  "Iron 1",
								Value: "iron1",
							},
							{
								Name:  "Iron 2",
								Value: "iron2",
							},
						},
						Required: false,
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
		options := i.ApplicationCommandData().Options
		content := ""

		switch options[0].Name {
		case "info":
			content = "info user"
		case "edit":
			content = "edit user"
		}

		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: content,
			},
		})
	})
}
