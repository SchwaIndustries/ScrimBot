module.exports = exports = {
  name: 'guildAdd', // service name
  enabled: true, // whether the servie should be loaded
  process: async (GLOBALS) => {
    GLOBALS.client.on('guildCreate', guild => {
      const defaultChannel = (guild.systemChannel || guild.embedChannel || guild.channels.cache.first())

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
