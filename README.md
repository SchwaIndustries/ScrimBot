# ScrimBot
A Discord bot for organizing Valorant custom games. Based off [Mountainz](https://github.com/Kalissaac/Mountainz).

## Running this yourself
The bot is pretty simple to set up, it really only needs a Discord bot token and a Firebase project.
1. First, get your bot token from Discord (https://discord.com/developers/applications).
2. Create a file named `.env` in the root directory of the bot or set your environment variables to the following contents:
```
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
