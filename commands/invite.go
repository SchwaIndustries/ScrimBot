package commands

import "github.com/bwmarrin/discordgo"

func init() {
	AddCommand(&discordgo.ApplicationCommand{
		Name:        "invite",
		Description: "Invite ScrimBot to another server",
	}, func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "go here to add scrimbot https://discord.com/oauth2/authorize?client_id=715030981894995998&scope=bot&permissions=2432904272",
			},
		})
	})
}
