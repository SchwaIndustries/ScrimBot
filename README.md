# ScrimBot
A Discord bot for organizing Valorant custom games. Based off [Mountainz](https://github.com/Kalissaac/Mountainz).

## Running this yourself
The bot is pretty simple to set up, it really only needs a Discord bot token and a Firebase project.
1. First, get your bot token from Discord.
2. Create a file named `.env` in the root directory of the bot, with the following contents:
```
TOKEN=<discord bot token>
FIR_PROJID=<Firebase project ID>
FIR_CLIENTID=<Firebase client ID>
FIR_PRIVATEKEY_ID=<Firebase private key ID>
FIR_PRIVATEKEY=<Firebase private key ID>
NOTIF_ROLES=<comma separated list of role ids for players who want notifications, optional>
TIME_ZONE=<desired time zone (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), default is America/Los_Angeles>
```
3. Replace `<discord bot token>` in the file with your bot token.
4. Create a Firebase project at console.firebase.google.com, and go to Settings > Service Accounts > Firebase Admin SDK > Generate a new key
5. Place the downloaded json file in the root directory of the bot, and copy the filename
6. Replace `<service account file name>` with your json filename

7. Run `npm install` and let it install the dependencies
8. Then run `npm start` and the bot should be online!
