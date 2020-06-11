const moment = require('moment-timezone')
const CONSTANTS = require('../constants')

module.exports = exports = {
  name: 'user',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    switch (message.content.split(' ')[1]) {
      case 'info': info(message, GLOBALS); break
      case 'edit': edit(message, GLOBALS); break
    }
  }
}

const info = async (message, GLOBALS) => {
  let userID = message.content.split(' ')[2]

  if (!userID) userID = message.author.id
  if (userID.startsWith('<@')) {
    userID = userID.replace(/<@!?/, '').replace(/>$/, '')
  }
  const userInformationRef = GLOBALS.db.collection('users').doc(userID)
  let userInformation = await userInformationRef.get()
  if (!userInformation.exists) return message.reply('User not found! Ensure correct user ID is submitted.')
  userInformation = userInformation.data()

  const userDiscordInformation = await GLOBALS.client.users.fetch(userID)

  const userEmbed = new GLOBALS.Embed()
    .setTitle('Retrieved User Information')
    .setDescription('')
    .setTimestamp(new Date())
    .setAuthor(userDiscordInformation.tag, userDiscordInformation.avatarURL())
    .setThumbnail(userDiscordInformation.avatarURL())
    .addField('Valorant Username', userInformation.valorantUsername, true)
    .addField('Valorant Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[userInformation.valorantRank]), true)
    .addField('Registration Date', moment(userInformation.timestamp.toMillis()).tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('h:mm a z DD MMM, YYYY'))
    .addField('Notifications Enabled', userInformation.notifications === true ? 'Yes' : 'No', true)
    .addField('Matches Played', userInformation.matches.length, true)
  message.reply(userEmbed)
}

const edit = async (message, GLOBALS) => {
  const attributes = message.content.split(' ')
  const editedProperty = attributes[2]
  if (!editedProperty) return message.reply('Please specify a property to edit! (username, rank, notifications)')

  let editedValue = attributes[3]
  if (!editedValue) return message.reply('Please specify a value for ' + editedProperty)

  const userInformationRef = GLOBALS.db.collection('users').doc(message.author.id)
  let userInformation = await userInformationRef.get()
  if (!userInformation.exists) return message.reply('User not found! Are you registered with ScrimBot?')
  userInformation = userInformation.data()

  switch (editedProperty) {
    case 'username':
      userInformation.valorantUsername = editedValue
      break
    case 'rank':
      editedValue = attributes[3] + ' ' + attributes[4]
      if (!CONSTANTS.RANKS[editedValue.toUpperCase()]) {
        return message.reply('Please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        userInformation.valorantRank = CONSTANTS.RANKS[editedValue.toUpperCase()] // TODO: cover edge cases
        break
      }
    case 'notifications':
      userInformation.notifications = (CONSTANTS.AFFIRMATIVE_WORDS.includes(editedValue.toLowerCase()))
      if (userInformation.notifications) message.member.roles.add('717802617534808084')
      else message.member.roles.remove('717802617534808084')
      break
    default:
      return message.reply('Requested property not found!')
  }
  userInformationRef.update(userInformation)
  message.reply(`${editedProperty} successfully changed to ${editedValue}!`)
}
