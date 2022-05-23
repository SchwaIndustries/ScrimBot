package commands

import "github.com/bwmarrin/discordgo"

func init() {
	AddCommand(&discordgo.ApplicationCommand{
		Name:        "support",
		Description: "Join the ScrimBot support server",
	}, func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "Join the ScrimBot support server: https://discord.gg/nRE9Ex7ptd",
			},
		})
	})
}
