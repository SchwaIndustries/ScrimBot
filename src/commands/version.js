const packageJSON = require('../../package.json')

module.exports = exports = {
  name: 'version',
  usage: '',
  enabled: true,
  /**
   * @param {import('@kalissaac/discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Version')
      .setDescription(`ScrimBot is currently on v${packageJSON.version}`)
    message.channel.send(embed)
  }
}
