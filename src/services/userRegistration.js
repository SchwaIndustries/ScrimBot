const CONSTANTS = require('../constants')

module.exports = exports = {
  name: 'userRegistration',
  enabled: true,
  /**
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (GLOBALS) => {
    GLOBALS.client.on('message', async message => {
      if (message.author === GLOBALS.client.user || message.author.bot === true) return // ignore messages from the bot itself or other bots
      if (GLOBALS.activeUserRegistration.has(message.author.id)) handleUserRegistration(GLOBALS.activeUserRegistration.get(message.author.id), message, GLOBALS)
    })

    GLOBALS.client.on('messageReactionAdd', (reaction, user) => {
      if (user.bot) return // ignore messages from the bot itself or other bots
      if (GLOBALS.activeUserRegistration.has(user.id)) cancelUserRegistration(reaction, user, GLOBALS)
    })
  }
}

/**
 * @param {import('@kalissaac/discord.js').Message} userMessage
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const handleUserRegistration = (userRecord, userMessage, GLOBALS) => {
  if (userMessage.channel.type !== 'dm') return

  switch (userRecord.step) {
    case 0:
      if (userMessage.content.match(/\S{3,16}#\S{3,5}/)) userRecord.registrationInformation.valorantUsername = userMessage.content
      else return userMessage.reply('Please give a valid username!').then(msg => msg.delete({ timeout: 5000 }))
      break
    case 1:
      if (!CONSTANTS.RANKS[userMessage.content.toUpperCase()]) {
        return userMessage.reply('Please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        userRecord.registrationInformation.valorantRank = CONSTANTS.RANKS[userMessage.content.toUpperCase()] // TODO: cover edge cases
        GLOBALS.updateUserRankRoles(userMessage.author, userRecord.registrationInformation.valorantRank)
        break
      }
    case 2:
      userRecord.registrationInformation.notifications = (CONSTANTS.AFFIRMATIVE_WORDS.includes(userMessage.content.toLowerCase()))
      if (userRecord.registrationInformation.notifications === true) GLOBALS.updateUserRoles(userMessage.author, 'notificationRole', true)
      break
  }

  if (userRecord.step < CONSTANTS.userRegistrationSteps.length - 1) {
    const embed = userRecord.botMessage.embeds[0]

    const previousField = embed.fields[userRecord.step]
    previousField.name = '✅ ' + previousField.name

    userRecord.step = userRecord.step + 1

    const stepInfo = CONSTANTS.userRegistrationSteps[userRecord.step]
    embed.addField(stepInfo[0], stepInfo[1])
    userRecord.botMessage.edit(embed)

    GLOBALS.activeUserRegistration.set(userRecord.userID, userRecord)
  } else {
    const embed = new GLOBALS.Embed()
      .setTitle('ScrimBot Registration Complete')
      .setDescription('Thanks for registering! Now it\'s time to get playing!')
    userRecord.botMessage.edit(embed)
    userRecord.botReaction.users.remove(GLOBALS.client.user)
    userRecord.registrationInformation.timestamp = new Date()
    GLOBALS.mongoDb.collection('users').insertOne({ _id: userRecord.userID, ...userRecord.registrationInformation })
    GLOBALS.activeUserRegistration.delete(userRecord.userID)
  }
}

/**
 * @param {import('@kalissaac/discord.js').MessageReaction} reaction
 * @param {import('@kalissaac/discord.js').User} user
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const cancelUserRegistration = async (reaction, user, GLOBALS) => {
  if (reaction.emoji.name === '❌') {
    const userRecord = GLOBALS.activeUserRegistration.get(user.id)
    const embed = new GLOBALS.Embed()
      .setTitle('ScrimBot Registration Cancelled')
      .setDescription('Your registration has been cancelled. If you want to try again, just type v!register.')
    userRecord.botMessage.edit(embed)
    GLOBALS.activeUserRegistration.delete(userRecord.userID)
    reaction.remove()
  }
}
