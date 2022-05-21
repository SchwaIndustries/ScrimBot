package commands

import "github.com/bwmarrin/discordgo"

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
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "go here to add scrimbot https://discord.com/oauth2/authorize?client_id=715030981894995998&scope=bot&permissions=2432904272",
			},
		})
	})
}
