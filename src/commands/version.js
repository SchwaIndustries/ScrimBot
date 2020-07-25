module.exports = exports = {
  name: 'version',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Version')
      .setDescription('ScrimBot is currently on v1.1.1')
    message.channel.send(embed)
  }
}
