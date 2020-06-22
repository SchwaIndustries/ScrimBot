module.exports = exports = {
  name: 'unban',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const attributes = message.content.split(' ')
    let unbanUser = attributes[1]
    if (!unbanUser) return message.reply('Please specify a user to unban.')
    if (unbanUser.startsWith('<@')) {
      unbanUser = unbanUser.replace(/<@!?/, '').replace(/>$/, '')
    }

    const userInformationRef = GLOBALS.db.collection('users').doc(unbanUser)
    let userInformation = await userInformationRef.get()
    if (!userInformation.exists) return message.reply('User not found! Are they registered with ScrimBot?')
    userInformation = userInformation.data()

    const playerPunishInformationRef = userInformationRef.collection('punishments')
    const playerPunishInformation = await playerPunishInformationRef.get()
    if (playerPunishInformation.docs.length <= 0) {
      return message.channel.send(`<@${unbanUser}> has no active bans!`)
    }

    const latestPunishment = playerPunishInformation.docs.slice(-1).pop().data()
    if (latestPunishment.unbanDate.toMillis() < Date.now()) {
      return message.channel.send(`<@${unbanUser}> has no active bans!`)
    }

    latestPunishment.unbanDate = new Date()
    playerPunishInformationRef.doc('' + latestPunishment.banDate.toMillis()).update(latestPunishment)

    const UnbanUser = await message.guild.members.fetch(unbanUser)
    let punishRole = await GLOBALS.db.collection('guilds').doc(message.guild.id).get()
    if (!punishRole.exists) return message.reply('Banned role does not exist in bot database. Make sure to run v!guild to setup roles.')
    punishRole = punishRole.get('banRole')
    UnbanUser.roles.remove(punishRole)

    const embed = new GLOBALS.Embed()
      .setTitle('User Unbanned')
      .addField('User:', `<@${unbanUser}>`)
    message.channel.send(embed)
  }
}
