package commands

import "github.com/bwmarrin/discordgo"

func init() {
	AddCommand(&discordgo.ApplicationCommand{
		Name:        "help",
		Description: "Information on how to use ScrimBot",
	}, func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "help for scrimbot",
			},
		})
	})
}
