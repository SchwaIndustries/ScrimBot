module.exports = exports = {
  name: 'support',
  usage: '',
  enabled: true,
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Join Our Support Server!')
    message.reply(embed)
    message.channel.send('https://discord.gg/nRE9Ex7ptd')
  }
}
