const http = require('http')

module.exports = exports = {
  name: 'heroku',
  enabled: true,
  process: async (GLOBALS) => {
    http.createServer((req, res) => {
      res.writeHead(200)
      res.end(`This is ScrimBot, invite it to your Discord server here: https://discord.com/oauth2/authorize?client_id=${GLOBALS.client.user.id}&scope=bot&permissions=8`)
    }).listen(process.env.PORT || 12500)
    setInterval(() => {
      http.get('http://valorant-scrim-bot.herokuapp.com')
    }, 5 * 60 * 1000) // 5 minutes in milliseconds
  }
}
