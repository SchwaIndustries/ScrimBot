const moment = require('moment')

module.exports = exports = {
  name: 'uptime',
  usage: '',
  enabled: true,
  /**
   * @param {import('@kalissaac/discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    const duration = moment.duration(GLOBALS.client.uptime).humanize()
    const embed = new GLOBALS.Embed()
      .setTitle('Uptime')
      .setDescription(`ScrimBot has been online for ${duration}`)
    message.reply(embed)
  }
}
