package commands

import "github.com/bwmarrin/discordgo"

var (
	CommandDatas map[string]*discordgo.ApplicationCommand                              = make(map[string]*discordgo.ApplicationCommand)
	Handlers     map[string]func(s *discordgo.Session, i *discordgo.InteractionCreate) = make(map[string]func(s *discordgo.Session, i *discordgo.InteractionCreate))
)

var (
	zero        = 0.0
	rankChoices = []*discordgo.ApplicationCommandOptionChoice{
		{
			Name:  "Iron 1",
			Value: "iron1",
		},
		{
			Name:  "Iron 2",
			Value: "iron2",
		},
		{
			Name:  "Iron 3",
			Value: "iron3",
		},
		{
			Name:  "Bronze 1",
			Value: "bronze1",
		},
		{
			Name:  "Bronze 2",
			Value: "bronze2",
		},
		{
			Name:  "Bronze 3",
			Value: "bronze3",
		},
		{
			Name:  "Silver 1",
			Value: "silver1",
		},
		{
			Name:  "Silver 2",
			Value: "silver2",
		},
		{
			Name:  "Silver 3",
			Value: "silver3",
		},
		{
			Name:  "Gold 1",
			Value: "gold1",
		},
		{
			Name:  "Gold 2",
			Value: "gold2",
		},
		{
			Name:  "Gold 3",
			Value: "gold3",
		},
		{
			Name:  "Platinum 1",
			Value: "platinum1",
		},
		{
			Name:  "Platinum 2",
			Value: "platinum2",
		},
		{
			Name:  "Platinum 3",
			Value: "platinum3",
		},
		{
			Name:  "Diamond 1",
			Value: "diamond1",
		},
		{
			Name:  "Diamond 2",
			Value: "diamond2",
		},
		{
			Name:  "Diamond 3",
			Value: "diamond3",
		},
		{
			Name:  "Immortal",
			Value: "immortal",
		},
		{
			Name:  "Radiant",
			Value: "radiant",
		},
	}
	mapChoices = []*discordgo.ApplicationCommandOptionChoice{
		{
			Name:  "Split",
			Value: "split",
		},
		{
			Name:  "Bind",
			Value: "bind",
		},
		{
			Name:  "Haven",
			Value: "haven",
		},
		{
			Name:  "Ascent",
			Value: "ascent",
		},
		{
			Name:  "Icebox",
			Value: "icebox",
		},
		{
			Name:  "Breeze",
			Value: "breeze",
		},
		{
			Name:  "Fracture",
			Value: "fracture",
		},
	}
	gameModeChoices = []*discordgo.ApplicationCommandOptionChoice{
		{
			Name:  "Standard",
			Value: "standard",
		},
		{
			Name:  "Spike Rush",
			Value: "spikerush",
		},
		{
			Name:  "Deathmatch",
			Value: "deathmatch",
		},
	}
)

func AddCommand(data *discordgo.ApplicationCommand, handler func(s *discordgo.Session, i *discordgo.InteractionCreate)) {
	CommandDatas[data.Name] = data
	Handlers[data.Name] = handler
}
