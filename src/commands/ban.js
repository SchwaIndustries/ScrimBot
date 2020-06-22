const moment = require('moment-timezone')

module.exports = exports = {
  name: 'ban',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const attributes = message.content.split(' ')
    let banUser = attributes[1]
    if (!banUser) return message.reply('Please specify a user to ban.')
    if (banUser.startsWith('<@')) {
      banUser = banUser.replace(/<@!?/, '').replace(/>$/, '')
    }

    let banLength = attributes[2]
    if (!banLength) return message.reply('Please specify a ban length.')
    else {
      banLength = moment().add(banLength.substring(0, banLength.length - 1), banLength.substring(banLength.length - 1))
    }

    const banReason = attributes.slice(3).join(' ')
    if (!banReason) return message.reply('Please specify a ban reason.')

    const userInformationRef = GLOBALS.db.collection('users').doc(banUser)
    let userInformation = await userInformationRef.get()
    if (!userInformation.exists) return message.reply('User not found! Are they registered with ScrimBot?')
    userInformation = userInformation.data()

    const playerPunishInformationRef = userInformationRef.collection('punishments')
    const playerPunishInformation = await playerPunishInformationRef.get()
    if (playerPunishInformation.docs.length > 0 && (playerPunishInformation.docs.slice(-1).pop().data().unbanDate.toMillis()) > Date.now()) {
      return message.channel.send(`<@${banUser}> is already banned`)
    }
    const newPunishment = {
      banDate: new Date(),
      unbanDate: banLength.toDate(),
      reason: banReason
    }

    playerPunishInformationRef.doc('' + newPunishment.banDate.getTime()).set(newPunishment)
    const BanUser = await message.guild.members.fetch(banUser)
    let punishRole = await GLOBALS.db.collection('guilds').doc(message.guild.id).get()
    if (!punishRole.exists) return message.reply('Banned role does not exist in bot database. Make sure to run v!guild to setup roles.')
    punishRole = punishRole.get('banRole')
    BanUser.roles.add(punishRole)

    const embed = new GLOBALS.Embed()
      .setTitle('User Banned')
      .addField('User:', `<@${banUser}>`)
      .addField('Banned On:', newPunishment.banDate)
      .addField('Ban Expiration:', newPunishment.unbanDate)
      .addField('Ban Reason', newPunishment.reason)
    message.channel.send(embed)
  }
}
