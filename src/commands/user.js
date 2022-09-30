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

  const winPercentage = (userInformation.matchesWon.length / userInformation.matches.length * 100).toFixed(1)

  const userEmbed = new GLOBALS.Embed()
    .setTitle('Retrieved User Information')
    .setDescription('')
    .setTimestamp(new Date())
    .setAuthor(userDiscordInformation.tag, userDiscordInformation.avatarURL())
    .setThumbnail(userDiscordInformation.avatarURL())
    .addField('Valorant Username', userInformation.valorantUsername, true)
    .addField('Valorant Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[userInformation.valorantRank]), true)
    .addField('Registration Date', moment(userInformation.timestamp).tz(process.env.TIME_ZONE).format('h:mm a z DD MMM, YYYY'))
    .addField('Notifications Enabled', userInformation.notifications === true ? 'Yes' : 'No', true)
    .addField('Matches Played', userInformation.matches.length, true)
    .addField('Matches Won', userInformation.matchesWon.length, true)
    .addField('Matches Lost', userInformation.matches.length - userInformation.matchesWon.length, true)
    .addField('Win Percentage', winPercentage + '%', true)
    .addField('Bot Admin', await GLOBALS.userIsAdmin(userID) === true ? 'Yes' : 'No', true)
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
        GLOBALS.updateUserRankRoles(message.author, userInformation.valorantRank)
        break
      }

    case 'notifications':
      userInformation.notifications = CONSTANTS.AFFIRMATIVE_WORDS.includes(editedValue.toLowerCase())
      if (userInformation.notifications) GLOBALS.updateUserRoles(message.author, 'notificationRole', true)
      else GLOBALS.updateUserRoles(message.author, 'notificationRole', false)
      break

    default:
      return message.reply('Requested property not found!')
  }

  await GLOBALS.mongoDb.collection('users').replaceOne({ _id: message.author.id }, userInformation)
  message.reply(`${editedProperty} successfully changed to ${editedValue}!`)
}
