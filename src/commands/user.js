const moment = require('moment-timezone')
const CONSTANTS = require('../constants')
const Discord = require('discord.js') // eslint-disable-line

module.exports = exports = {
  name: 'user',
  usage: '<info/edit>',
  enabled: true,
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    switch (message.content.split(' ')[1]) {
      case 'info': info(message, GLOBALS); break
      case 'edit': edit(message, GLOBALS); break
    }
  }
}

/**
 * Updates a user's role across all servers that the user and bot share
 * @param {Discord.User} user User to update roles for
 * @param {Discord.RoleResolvable} role The role to update
 * @param {boolean} addRole Whether to add the role to the user or remove it
 * @param {Object} GLOBALS GLOBALS object
 */
const updateUserRoles = async (user, role, addRole, GLOBALS) => {
  const querySnapshot = await GLOBALS.mongoDb.collection('guilds').find()
  querySnapshot.forEach(async documentSnapshot => {
    if (!documentSnapshot) return
    if (!GLOBALS.client.guilds.resolve(documentSnapshot._id)) return

    const guildMember = await GLOBALS.client.guilds.resolve(documentSnapshot._id).members.fetch(user.id).catch(console.error)
    if (!guildMember) return
    if (addRole) guildMember.roles.add(documentSnapshot[role])
    else guildMember.roles.remove(documentSnapshot[role])
  })
}

/**
 * Updates a user's competitive rank across all servers that the user and bot share
 * @param {Discord.User} user User to update rank roles for
 * @param {Number} rank User's new rank
 * @param {Object} GLOBALS GLOBALS object
 */
const updateUserRankRoles = async (user, rank, GLOBALS) => {
  const querySnapshot = await GLOBALS.mongoDb.collection('guilds').find()
  querySnapshot.forEach(async documentSnapshot => {
    if (!documentSnapshot) return
    if (!GLOBALS.client.guilds.resolve(documentSnapshot._id)) return
    if (!documentSnapshot.valorantRankRoles) return

    const guildMember = await GLOBALS.client.guilds.resolve(documentSnapshot._id).members.fetch(user.id).catch(console.error)
    if (!guildMember) return
    const allRankRoles = documentSnapshot.valorantRankRoles
    await guildMember.roles.remove(allRankRoles).catch(console.error)
    const rankRole = allRankRoles[rank.toString()[0] - 1]
    guildMember.roles.add(rankRole)
  })
}

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const info = async (message, GLOBALS) => {
  let userID = message.content.split(' ')[2]

  if (!userID) userID = message.author.id
  if (userID.startsWith('<@')) {
    userID = userID.replace(/<@!?/, '').replace(/>$/, '')
  }
  const userInformation = await GLOBALS.mongoDb.collection('users').findOne({ _id: userID })
  if (!userInformation) return message.reply('User not found! Ensure correct user ID is submitted.')

  const userDiscordInformation = await GLOBALS.client.users.fetch(userID)

  const userEmbed = new GLOBALS.Embed()
    .setTitle('Retrieved User Information')
    .setDescription('')
    .setTimestamp(new Date())
    .setAuthor(userDiscordInformation.tag, userDiscordInformation.avatarURL())
    .setThumbnail(userDiscordInformation.avatarURL())
    .addField('Valorant Username', userInformation.valorantUsername, true)
    .addField('Valorant Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[userInformation.valorantRank]), true)
    .addField('Registration Date', moment(userInformation.timestamp.toMillis()).tz(process.env.TIME_ZONE).format('h:mm a z DD MMM, YYYY'))
    .addField('Notifications Enabled', userInformation.notifications === true ? 'Yes' : 'No', true)
    .addField('Matches Played', userInformation.matches.length, true)
  message.reply(userEmbed)
}

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const edit = async (message, GLOBALS) => {
  const attributes = message.content.split(' ')
  const editedProperty = attributes[2]
  if (!editedProperty) return message.reply('Please specify a property to edit! (username, rank, notifications)')

  const editedValue = attributes.slice(3).join(' ')
  if (!editedValue) return message.reply('Please specify a value for ' + editedProperty)

  const userInformation = await GLOBALS.mongoDb.collection('users').findOne({ _id: message.author.id })
  if (!userInformation) return message.reply('User not found! Are you registered with ScrimBot?')

  switch (editedProperty) {
    case 'username':
      if (editedValue.match(/\S{3,16}#\S{3,5}/)) userInformation.valorantUsername = editedValue
      else return message.reply('Please give a valid username!').then(msg => msg.delete({ timeout: 5000 }))
      break

    case 'rank':
      if (!CONSTANTS.RANKS[editedValue.toUpperCase()]) {
        return message.reply('Please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        userInformation.valorantRank = CONSTANTS.RANKS[editedValue.toUpperCase()] // TODO: cover edge cases
        updateUserRankRoles(message.author, userInformation.valorantRank, GLOBALS)
        break
      }

    case 'notifications':
      userInformation.notifications = CONSTANTS.AFFIRMATIVE_WORDS.includes(editedValue.toLowerCase())
      if (userInformation.notifications) updateUserRoles(message.author, 'notificationRole', true, GLOBALS)
      else updateUserRoles(message.author, 'notificationRole', false, GLOBALS)
      break

    default:
      return message.reply('Requested property not found!')
  }

  await GLOBALS.mongoDb.collection('users').replaceOne({ _id: message.author.id }, userInformation)
  message.reply(`${editedProperty} successfully changed to ${editedValue}!`)
}
