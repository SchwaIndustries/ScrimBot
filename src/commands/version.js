const packageJSON = require('../../package.json')

module.exports = exports = {
  name: 'version',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Version')
      .setDescription(`ScrimBot is currently on v${packageJSON.version}`)
    message.channel.send(embed)
  }
}
