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

  const banReason = attributes[3]
  if (!banReason) return message.reply('Please specify a ban reason.')

  let banLength = attributes[4]
  if (!banLength) return message.reply('Please specify a ban length.')
  else {
    banLength = moment().add(banLength.substring(0, banLength.length - 1), banLength.substring(banLength.length - 1))
  }

  const userInformationRef = GLOBALS.db.collection('users').doc(banUser)
  let userInformation = await userInformationRef.get()
  if (!userInformation.exists) return message.reply('User not found! Are they registered with ScrimBot?')
  userInformation = userInformation.data()
  if (userInformation.isBanned === true) return message.channel.send(`<@${banUser}> is already banned`)

  userInformation.banDate = new Date()
  userInformation.unbanDate = banLength.toDate()
  userInformation.isBanned = true
  userInformationRef.update(userInformation)
  const BanUser = await message.guild.members.fetch(banUser)
  BanUser.roles.add('720902105543606272')

  const embed = new GLOBALS.Embed()
    .setTitle('User Banned')
    .addField('User:', `<@${banUser}>`)
    .addField('Banned On:', userInformation.banDate)
    .addField('Ban Expiration:', userInformation.unbanDate)
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
  if (userInformation.isBanned === false) return message.channel.send(`<@${unbanUser}> is not banned`)

  userInformation.isBanned = false
  userInformationRef.update(userInformation)
  const UnbanUser = await message.guild.members.fetch(unbanUser)
  UnbanUser.roles.remove('720902105543606272')

  const embed = new GLOBALS.Embed()
    .setTitle('User Unbanned')
    .addField('User:', `<@${unbanUser}>`)
  message.channel.send(embed)
}
