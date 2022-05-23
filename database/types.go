package database

type Map uint8

const (
	Split Map = iota
	Bind
	Haven
	Ascent
	Icebox
	Breeze
	Fracture
)

type Rank uint64

const (
	AnyMin Rank = 0
	AnyMax Rank = 99
)
const (
	Iron1 Rank = 11 + iota
	Iron2
	Iron3
)
const (
	Bronze1 Rank = 21 + iota
	Bronze2
	Bronze3
)
const (
	Silver1 Rank = 31 + iota
	Silver2
	Silver3
)
const (
	Gold1 Rank = 41 + iota
	Gold2
	Gold3
)
const (
	Platinum1 Rank = 51 + iota
	Platinum2
	Platinum3
)
const (
	Diamond1 Rank = 61 + iota
	Diamond2
	Diamond3
)
const (
	Immortal Rank = 71 + iota
)
const (
	Radiant Rank = 81 + iota
)

type Match struct {
	ID           string `bson:"_id" json:"_id"`
	Date         string `bson:"date" json:"date"`
	Status       string `bson:"status" json:"status"`
	Creator      string `bson:"creator" json:"creator"`
	Map          string `bson:"map" json:"map"`
	Mode         string `bson:"mode" json:"mode"`
	MaxTeamCount uint64 `bson:"maxTeamCount" json:"maxTeamCount"`
	Players      struct {
		A []string `bson:"a" json:"a"`
		B []string `bson:"b" json:"b"`
	} `bson:"players" json:"players"`
	Spectators  []string `bson:"spectators" json:"spectators"`
	RankMinimum Rank     `bson:"rankMinimum" json:"rankMinimum"`
	RankMaximum Rank     `bson:"rankMaximum" json:"rankMaximum"`
	Message     struct {
		Channel string `bson:"channel" json:"channel"`
		ID      string `bson:"id" json:"id"`
	} `bson:"message" json:"message"`
	Timestamp string `bson:"timestamp" json:"timestamp"`
}
