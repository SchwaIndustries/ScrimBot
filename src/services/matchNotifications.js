module.exports = exports = {
  name: 'matchNotifications',
  enabled: true,
  process: async (GLOBALS) => {
    GLOBALS.client.on('guildMemberAdd', async member => {
      const guildData = await GLOBALS.db.collection('guilds').doc(member.guild.id).get()
      if (!guildData.exists) return
      member.roles.add(guildData.get('notificationRole'))
    })
  }
}
