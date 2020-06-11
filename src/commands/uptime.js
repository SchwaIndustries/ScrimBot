module.exports = exports = {
  name: 'uptime',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Uptime')
      .setDescription(`ScrimBot has been online for ${Math.floor(GLOBALS.client.uptime / 60000)} minutes :)`)
    message.reply(embed)
  }
}
