module.exports = exports = {
  name: 'status',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Bot Status')
      .setDescription(`Current Uptime: ${Math.floor(GLOBALS.client.uptime / 60000)} minutes\nCurrent Ping: ${GLOBALS.client.ws.ping}ms\nRunning on Port: ${GLOBALS.app.get('port')}`)
    message.channel.send(embed)
  }
}
