const https = require('https')

module.exports = exports = {
  name: 'heroku',
  enabled: true,
  process: async (GLOBALS) => {
    GLOBALS.app.set('port', (process.env.PORT || 12500))

    GLOBALS.app.get('/', function (request, response) {
      response.send('Hey')
    }).listen(GLOBALS.app.get('port'), function () {
      console.log(`ScrimBot Initialized | Running on port ${GLOBALS.app.get('port')}`)
    })

    setInterval(() => {
      https.get('https://valorant-scrim-bot.herokuapp.com')
    }, 5 * 60 * 1000) // 5 minutes in milliseconds
  }
}
