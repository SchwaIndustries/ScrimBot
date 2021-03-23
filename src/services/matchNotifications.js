module.exports = exports = {
  name: 'matchNotifications',
  enabled: true,
  /**
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (GLOBALS) => {
    GLOBALS.client.on('guildMemberAdd', async member => {
      const guildData = await GLOBALS.mongoDb.collection('guilds').findOne({ _id: member.guild.id })
      if (!guildData) return

      const memberData = await GLOBALS.mongoDb.collection('users').findOne({ _id: member.id })
      if (memberData && memberData.notifications) {
        member.roles.add(guildData.notificationRole)
      }
    })
  }
}
