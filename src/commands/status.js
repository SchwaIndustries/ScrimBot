const moment = require('moment')
require('moment-duration-format')

module.exports = exports = {
  name: 'status',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const duration = moment.duration(GLOBALS.client.uptime).format(' D [days], H [hrs], m [mins], s [secs]')
    const embed = new GLOBALS.Embed()
      .setTitle('Bot Status')
      .setDescription(`Current Uptime: ${duration}\nCurrent Ping: ${GLOBALS.client.ws.ping}ms\nCurrently in ${GLOBALS.client.guilds.cache.size} servers`)
    message.channel.send(embed)
  }
}
