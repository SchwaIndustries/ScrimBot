const moment = require('moment')

module.exports = exports = {
  name: 'status',
  usage: '',
  enabled: true,
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    const duration = moment.duration(GLOBALS.client.uptime).humanize()
    const embed = new GLOBALS.Embed()
      .setTitle('Bot Status')
      .setDescription(`Current Uptime: ${duration}\nCurrent Ping: ${GLOBALS.client.ws.ping}ms\nCurrently in ${GLOBALS.client.guilds.cache.size} servers`)
    message.channel.send(embed)
  }
}
