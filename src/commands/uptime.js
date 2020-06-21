const moment = require('moment')
require('moment-duration-format')

module.exports = exports = {
  name: 'uptime',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const duration = moment.duration(GLOBALS.client.uptime).format(' D [days], H [hrs], m [mins], s [secs]')
    const embed = new GLOBALS.Embed()
      .setTitle('Uptime')
      .setDescription(`ScrimBot has been online for ${duration}`)
    message.reply(embed)
  }
}
