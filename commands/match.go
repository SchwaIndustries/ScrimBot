package commands

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/olebedev/when"
	"github.com/olebedev/when/rules/common"
	"github.com/olebedev/when/rules/en"
	"schwa.tech/scrimbot/database"
	"schwa.tech/scrimbot/utils"
)

var (
	w *when.Parser
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

func init() {
	w = when.New(nil)
	w.Add(en.All...)
	w.Add(common.All...)
}

func createMatchHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if i.Member == nil || i.GuildID == "" {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "This command can only be used in servers!",
			},
		})
		return
	}

	interactionData := i.ApplicationCommandData()
	matchData := database.Match{
		Status:      "created",
		Creator:     i.Member.User.ID,
		Mode:        "standard",
		RankMinimum: database.Iron1,
		RankMaximum: database.Radiant,
		Timestamp:   time.Now().Format(time.RFC3339),
	}
	matchData.Players.A = make([]string, 0)
	matchData.Players.B = make([]string, 0)

	for _, option := range interactionData.Options[0].Options {
		switch option.Name {
		case "date":
			r, err := w.Parse(option.StringValue(), time.Now())
			if err != nil || r == nil {
				s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
					Type: discordgo.InteractionResponseChannelMessageWithSource,
					Data: &discordgo.InteractionResponseData{
						Content: "Unknown date or time format!",
					},
				})
				return
			}
			matchData.Date = r.Time.Format(time.RFC3339)
		case "playercount":
			matchData.MaxTeamCount = option.UintValue()
		case "spectators":
			if option.BoolValue() {
				matchData.Spectators = make([]string, 0)
			} else {
				matchData.Spectators = nil
			}
		case "map":
			matchData.Map = option.StringValue()
		case "mode":
			matchData.Mode = option.StringValue()
		case "rankmin":
			matchData.RankMinimum = utils.RankNameToID(option.StringValue())
		case "rankmax":
			matchData.RankMaximum = utils.RankNameToID(option.StringValue())
		}
	}

	matchEmbed := discordgo.MessageEmbed{
		Title:       "Match Information",
		Description: "Press one of the buttons below this message to join a team!",
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: utils.MapThumbnailURL(matchData.Map),
		},
		Author: &discordgo.MessageEmbedAuthor{
			Name:    fmt.Sprintf("%s#%s", i.Member.User.Username, i.Member.User.Discriminator),
			IconURL: i.Member.AvatarURL(""),
		},
		Timestamp: matchData.Date,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "Status",
				Value:  utils.CapitalizeFirstLetter(matchData.Status),
				Inline: true,
			},
			{
				Name:   "Game Mode",
				Value:  utils.CapitalizeFirstLetter(matchData.Mode),
				Inline: true,
			},
			{
				Name:   "Map",
				Value:  utils.CapitalizeFirstLetter(matchData.Map),
				Inline: true,
			},
			{
				Name:   "Max Team Count",
				Value:  fmt.Sprintf("%d players per team", matchData.MaxTeamCount),
				Inline: true,
			},
			{
				Name:   "Minimum Rank",
				Value:  utils.RankIDToName(matchData.RankMinimum),
				Inline: true,
			},
			{
				Name:   "Maximum Rank",
				Value:  utils.RankIDToName(matchData.RankMaximum),
				Inline: true,
			},
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
	}

	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{&matchEmbed},
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
		return
	}

	message, err := s.InteractionResponse(i.Interaction)
	if err != nil {
		log.Println(err)
	}

	matchData.ID = message.ID
	matchData.Message.Channel = message.ChannelID
	matchData.Message.ID = message.ID
	matchEmbed.Footer = &discordgo.MessageEmbedFooter{
		Text: "match id: " + matchData.ID,
	}

	_, err = s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
		Embeds: []*discordgo.MessageEmbed{&matchEmbed},
	})
	if err != nil {
		log.Println(err)
	}

	_, err = database.GetDB().Collection("matches").InsertOne(context.TODO(), matchData)
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

// TODO: convert this to a message component action, not a slash command
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

// TODO: convert this to a message component action, not a slash command
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
