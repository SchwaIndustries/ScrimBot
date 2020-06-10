module.exports = exports = {
    name: 'status',
    usage: '',
    enabled: true,
    process: async (message, GLOBALS) => {
      const embed = GLOBALS.embed()
        .setTitle('Bot Status')
        .setDescription(`Current Uptime: ${Math.floor(client.uptime / 60000)} minutes\nCurrent Ping: ${client.ws.ping}ms\nRunning on Port: ${app.get('port')}`)
        message.channel.send(embed)

  }
}
