const moment = require('moment-timezone')

module.exports = exports = {
  name: 'punish',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    switch (message.content.split(' ')[1]) {
      case 'ban': ban(message, GLOBALS); break
      case 'unban': unban(message, GLOBALS); break
    }
  }
}

const ban = async (message, GLOBALS) => {
  const attributes = message.content.split(' ')
  let banUser = attributes[2]
  if (!banUser) return message.reply('Please specify a user to ban.')
  if (banUser.startsWith('<@')) {
    banUser = banUser.replace(/<@!?/, '').replace(/>$/, '')
  }

  let banLength = attributes[3]
  if (!banLength) return message.reply('Please specify a ban length.')
  else {
    banLength = moment().add(banLength.substring(0, banLength.length - 1), banLength.substring(banLength.length - 1))
  }

  const banReason = attributes.slice(4).join(' ')
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
  BanUser.roles.add('720902105543606272')

  const embed = new GLOBALS.Embed()
    .setTitle('User Banned')
    .addField('User:', `<@${banUser}>`)
    .addField('Banned On:', newPunishment.banDate)
    .addField('Ban Expiration:', newPunishment.unbanDate)
    .addField('Ban Reason', newPunishment.reason)
  message.channel.send(embed)
}

const unban = async (message, GLOBALS) => {
  const attributes = message.content.split(' ')
  let unbanUser = attributes[2]
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
  console.log(latestPunishment)
  playerPunishInformationRef.doc('' + latestPunishment.banDate.toMillis()).update(latestPunishment)

  const UnbanUser = await message.guild.members.fetch(unbanUser)
  UnbanUser.roles.remove('720902105543606272')

  const embed = new GLOBALS.Embed()
    .setTitle('User Unbanned')
    .addField('User:', `<@${unbanUser}>`)
  message.channel.send(embed)
}
