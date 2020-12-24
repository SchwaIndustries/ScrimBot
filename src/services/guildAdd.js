module.exports = exports = {
  name: 'guildAdd',
  enabled: true,
  /**
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (GLOBALS) => {
    GLOBALS.client.on('guildCreate', guild => {
      const defaultChannel = guild.channels.cache.find(c => c.permissionsFor(GLOBALS.client.user).has('SEND_MESSAGES'))

      defaultChannel.send({
        embed: {
          title: 'Welcome to ScrimBot',
          description: 'Thanks for adding ScrimBot to your server! To get up and running, please type `v!server add`. None of the commands will work until this guild is configured.',
          color: 10181046
        }
      })
    })
  }
}
