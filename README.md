# ScrimBot

[![Add ScrimBot to server](https://img.shields.io/static/v1?label=Add%20ScrimBot&message=to%20server&color=7289DA&logo=Discord&logoColor=white&style=flat-square)](https://discord.com/oauth2/authorize?client_id=715030981894995998&scope=bot&permissions=8)


ScrimBot is Discord bot meant to allow for the easy creation of VALORANT custom matches.

 You tell the bot how many players per team, when the match will be and what map you would like and the bot will do the rest. Interested players can then react to the message to join a team, and once the match is complete you can add the final score and the match will be recorded for posterity.

 Players can also tell the bot their competitive rank and it will automatically assign them a role in all servers that they share with the bot.

 Additionally, server moderation is offered to admins, if you choose to use it.

_ScrimBot is based off [Mountainz](https://github.com/Kalissaac/Mountainz)._

## Running this yourself
The bot is pretty simple to set up, it really only needs a Discord bot token and a Firebase project.
1. First, get your bot token from Discord (https://discord.com/developers/applications).
2. Create a file named `.env` in the root directory of the bot or set your environment variables to the following contents:
```
.env
TOKEN=<discord bot token>
TIME_ZONE=<desired time zone (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), default is America/Los_Angeles>
```
3. Replace `<discord bot token>` in the file with your bot token.
4. Create a Firebase project at console.firebase.google.com, and go to Settings > Service Accounts > Firebase Admin SDK > Generate a new key
5. You now have two options: if you want to store the JSON locally, you can put the file in your project folder and set an additional key in `.env` which points to it:
```
.env
GOOGLE_APPLICATION_CREDENTIALS=</path/to/service-account-file.json>
```
or, if you are unable to store a JSON file in your project directory, you can add some specific keys to your `.env` and ScrimBot will do the rest for you.
```
.env
FIR_PROJID=<Firebase project ID>
FIR_CLIENTID=<Firebase client ID>
FIR_PRIVATEKEY_ID=<Firebase private key ID>
FIR_PRIVATEKEY=<Firebase private key>
```
If both are present, `GOOGLE_APPLICATION_CREDENTIALS` will be preferred.

6. Run `npm install` and let it install the dependencies
7. Then run `npm start` and the bot should be online!
