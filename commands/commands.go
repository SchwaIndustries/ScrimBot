package commands

import "github.com/bwmarrin/discordgo"

var (
	CommandDatas map[string]*discordgo.ApplicationCommand                              = make(map[string]*discordgo.ApplicationCommand)
	Handlers     map[string]func(s *discordgo.Session, i *discordgo.InteractionCreate) = make(map[string]func(s *discordgo.Session, i *discordgo.InteractionCreate))
)

var (
	zero = 0.0
)

func AddCommand(data *discordgo.ApplicationCommand, handler func(s *discordgo.Session, i *discordgo.InteractionCreate)) {
	CommandDatas[data.Name] = data
	Handlers[data.Name] = handler
}
