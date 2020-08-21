const moment = require('moment')

module.exports = exports = {
  name: 'uptime',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const duration = moment.duration(GLOBALS.client.uptime).humanize()
    const embed = new GLOBALS.Embed()
      .setTitle('Uptime')
      .setDescription(`ScrimBot has been online for ${duration}`)
    message.reply(embed)
  }
}
