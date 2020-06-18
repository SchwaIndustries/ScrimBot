module.exports = exports = {
  name: 'ping',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('You have pinged me')
      .setDescription(`Who's down for a game of ping pong?\n${GLOBALS.client.ws.ping}ms`)
      .setURL('https://pong-2.com/')
    message.reply(embed)
  }
}
