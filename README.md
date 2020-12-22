# ScrimBot

[![Add ScrimBot to server](https://img.shields.io/static/v1?label=Add%20ScrimBot&message=to%20server&color=7289DA&logo=Discord&logoColor=white&style=flat-square)](https://discord.com/oauth2/authorize?client_id=715030981894995998&scope=bot&permissions=285355008)

[![ScrimBot Support](https://img.shields.io/static/v1?label=ScrimBot%20Support&message=server&color=7289DA&logo=Discord&logoColor=white&style=flat-square)](https://discord.gg/hfFJxUG)




ScrimBot is Discord bot meant to allow for the easy creation of VALORANT custom matches.

 You tell the bot how many players per team, when the match will be and what map you would like and the bot will do the rest. Interested players can then react to the message to join a team, and once the match is complete you can add the final score and the match will be recorded for posterity.

 Players can also tell the bot their competitive rank and it will automatically assign them a role in all servers that they share with the bot.

_ScrimBot is based off [Mountainz](https://github.com/Kalissaac/Mountainz)._

## Running this yourself

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Requirements:
1. Firebase Project (https://console.firebase.google.com/)
2. Discord Bot Token (https://discord.com/developers/applications)
3. Node.js Version 12 or higher (https://nodejs.org/en/download/)

### Instructions:
ScrimBot configuration is handled through environment variables. These can be set inside your terminal, on your hosting platform, or using a file named `.env` in the project directory.

Here's a helpful guide on how to set them up for your platform: https://www.twilio.com/blog/2017/01/how-to-set-environment-variables.html

For the purposes of this guide, we'll be using a `.env` file, which is the easiest option.

---
0. Clone the repository
```
$ git clone https://github.com/SchwaIndustries/ScrimBot.git
$ cd ScrimBot
```

1. Create a file named `.env` in the root directory of the bot with the following contents:
```
TOKEN=<discord bot token>
TIME_ZONE=<(OPTIONAL) desired time zone (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), default is America/Los_Angeles>
PREFIX=<(OPTIONAL) desired bot prefix, default is v!>
```

2. Replace `<discord bot token>` with your bot token

3. In your Firebase project, navigate to Settings > Service Accounts > Firebase Admin SDK and click **Generate a new key**

4. You now have two options: if you want to store the JSON locally, you can put the file in your project folder and set an additional key which points to it:
```
GOOGLE_APPLICATION_CREDENTIALS=</path/to/service-account-file.json>
```
or, if you are unable to store a JSON file in your project directory, you can add some specific keys and ScrimBot will do the rest for you.
```
FIR_PROJID=<Firebase project ID>
FIR_CLIENTID=<Firebase client ID>
FIR_PRIVATEKEY_ID=<Firebase private key ID>
FIR_PRIVATEKEY=<Firebase private key>
```
If both are present, `GOOGLE_APPLICATION_CREDENTIALS` will be preferred.

6. Run `npm install` to install bot dependencies

7. Run `npm start` and the bot should be online!

8. You can add yourself as a bot admin by modifying your user entry in the database. In the `users` collection, find your user ID and add a field named `admin` with the boolean value of `true`. This will allow you to access certain bot admin commands.


### Adding Slash Commands
Populating slash comands requires a bit of extra work to get setup, but it's pretty straightforward for the most part and only needs to be done once.

To create the commands you need to send a POST request to the `https://discord.com/api/v8/applications/<bot_id>/commands`, with the command information as the body. You can only send one command at a time. Sample code is listed below for Node.JS, but you can use whatever method you want. Make sure you input your bot ID and token.

```js
const fetch = require('node-fetch')

const command = // Copy one of the commands below and paste the JSON here

async function main () {
  const response = await fetch('https://discord.com/api/v8/applications/<bot_id>/commands', {
    method: 'post',
    body: JSON.stringify(command),
    headers: {
      'Authorization': 'Bot <bot_token>',
      'Content-Type': 'application/json'
    }
  })
  const json = await response.json()

  console.log(json)
}
main()
```

If you get a 201 code, then your command has been created! It may take up to an hour for it to show up across all servers.

**Create a Match:**
```json
{
  "name": "matchCreate",
  "description": "Create a new ScrimBot match",
  "options": [
    {
      "name": "playerCount",
      "description": "How many players should be on each team? Max 5.",
      "type": 4,
      "required": true
    },
    {
      "name": "spectators",
      "description": "Are spectators allowed?",
      "type": 5,
      "required": true
    },
    {
      "name": "map",
      "description": "Which map would you like to play on?",
      "type": 3,
      "required": true,
      "choices": [
        {
          "name": "Split",
          "value": "map_split"
        },
        {
          "name": "Bind",
          "value": "map_bind"
        },
        {
          "name": "Haven",
          "value": "map_haven"
        },
        {
          "name": "Ascent",
          "value": "map_ascent"
        },
        {
          "name": "Icebox",
          "value": "map_icebox"
        }
      ]
    },
    {
      "name": "gameMode",
      "description": "What game mode would you like?",
      "type": 3,
      "required": true,
      "choices": [
        {
          "name": "Standard",
          "value": "mode_standard"
        },
        {
          "name": "Spike Rush",
          "value": "mode_spikerush"
        },
        {
          "name": "Deathmatch",
          "value": "mode_deathmatch"
        }
      ]
    },
    {
      "name": "date",
      "description": "When will the match be? If no date is specified the current day is assumed.",
      "type": 3,
      "required": false
    },
    {
      "name": "rankMinimum",
      "description": "What is the minimum rank you are allowing into your game?",
      "type": 4,
      "required": false
    },
    {
      "name": "rankMaximum",
      "description": "What is the maximum rank you are allowing into your game?",
      "type": 4,
      "required": false
    }
  ]
}
```

**Edit a Match:**
```json
{
  "name": "matchEdit",
  "description": "Edit an already created match",
  "options": [
    {
      "name": "matchID",
      "description": "What is the ID of the match you want to edit?",
      "type": 4,
      "required": true
    },
    {
      "name": "playerCount",
      "description": "How many players should be on each team? Max 5.",
      "type": 4,
      "required": false
    },
    {
      "name": "spectators",
      "description": "Are spectators allowed?",
      "type": 5,
      "required": false
    },
    {
      "name": "map",
      "description": "Which map would you like to play on?",
      "type": 3,
      "required": false,
      "choices": [
        {
          "name": "Split",
          "value": "map_split"
        },
        {
          "name": "Bind",
          "value": "map_bind"
        },
        {
          "name": "Haven",
          "value": "map_haven"
        },
        {
          "name": "Ascent",
          "value": "map_ascent"
        },
        {
          "name": "Icebox",
          "value": "map_icebox"
        }
      ]
    },
    {
      "name": "gameMode",
      "description": "What game mode would you like?",
      "type": 3,
      "required": false,
      "choices": [
        {
          "name": "Standard",
          "value": "mode_standard"
        },
        {
          "name": "Spike Rush",
          "value": "mode_spikerush"
        },
        {
          "name": "Deathmatch",
          "value": "mode_deathmatch"
        }
      ]
    },
    {
      "name": "date",
      "description": "When will the match be? If no date is specified the current day is assumed.",
      "type": 3,
      "required": false
    },
    {
      "name": "rankMinimum",
      "description": "What is the minimum rank you are allowing into your game?",
      "type": 4,
      "required": false
    },
    {
      "name": "rankMaximum",
      "description": "What is the maximum rank you are allowing into your game?",
      "type": 4,
      "required": false
    }
  ]
}
```

**Start a Match:**
```json
{
  "name": "matchStart",
  "description": "Start a match",
  "options": [
    {
      "name": "matchID",
      "description": "What is the ID of the match you want to start?",
      "type": 4,
      "required": true
    }
  ]
}
```

**Score a Match:**
```json
{
  "name": "matchScore",
  "description": "Score a match",
  "options": [
    {
      "name": "matchID",
      "description": "What is the ID of the match you want to score?",
      "type": 4,
      "required": true
    },
    {
      "name": "teamAScore",
      "description": "What is the score of team A?",
      "type": 4,
      "required": true
    },
    {
      "name": "teamBScore",
      "description": "What is the score of team B?",
      "type": 4,
      "required": true
    }
  ]
}
```

**Cancel a Match:**
```json
{
  "name": "matchCancel",
  "description": "Cancel a match",
  "options": [
    {
      "name": "matchID",
      "description": "What is the ID of the match you want to cancel?",
      "type": 4,
      "required": true
    }
  ]
}
```

**Get Info About a Match:**
```json
{
  "name": "matchInfo",
  "description": "Get info about a match",
  "options": [
    {
      "name": "matchID",
      "description": "What is the ID of the match you want to get information about?",
      "type": 4,
      "required": true
    }
  ]
}
```

**Register with ScrimBot:**
```json
{
  "name": "register",
  "description": "Register with ScrimBot",
  "options": [
    {
      "name": "username",
      "description": "What is your FULL Valorant username? (including tag, e.g. `Username#NA1`)",
      "type": 3,
      "required": true
    },
    {
      "name": "rank",
      "description": "What rank are you in Valorant? If you don't have a rank, go with \"Iron 1\".",
      "type": 4,
      "required": true
    },
    {
      "name": "notifications",
      "description": "Do you want to be notified when matches are created?",
      "type": 5,
      "required": true
    }
  ]
}
```

**Get Info About a User:**
```json
{
  "name": "userInfo",
  "description": "Get info about a user",
  "options": [
    {
      "name": "userID",
      "description": "What is the ID of the user you want to get information about?",
      "type": 4,
      "required": true
    }
  ]
}
```

**Edit User Information:**
```json
{
  "name": "userEdit",
  "description": "Edit user information",
  "options": [
    {
      "name": "username",
      "description": "What is your FULL Valorant username? (including tag, e.g. `Username#NA1`)",
      "type": 3,
      "required": false
    },
    {
      "name": "rank",
      "description": "What rank are you in Valorant? If you don't have a rank, go with \"Iron 1\".",
      "type": 4,
      "required": false
    },
    {
      "name": "notifications",
      "description": "Do you want to be notified when matches are created?",
      "type": 5,
      "required": false
    }
  ]
}
```

** a Match:**
```json

```