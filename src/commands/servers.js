module.exports = exports = {
  name: 'servers',
  usage: '',
  enabled: true,
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    if (await GLOBALS.userIsAdmin(message.author.id) === false) return message.reply('This command can only be executed by bot admins.')
    const embed = new GLOBALS.Embed()
      .setTitle('Uptime')
      .setDescription(`ScrimBot is currently in ${GLOBALS.client.guilds.cache.size} guilds :slight_smile:`)
      .addField('Servers', `${GLOBALS.client.guilds.cache.map(x => '\n' + x.name)}`)
    message.reply(embed)
  }
}
