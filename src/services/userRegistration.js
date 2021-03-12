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

    GLOBALS.client.ws.on('INTERACTION_CREATE', async interaction => {
      if (interaction.data.name !== 'register') return
      await handleSlashCommandUserRegistration(interaction, GLOBALS)
    })
  }
}

/**
 * @param {import('discord.js').User} user
 * @param {string} role
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const updateUserRoles = async (user, role, addRole, GLOBALS) => {
  const querySnapshot = await GLOBALS.db.collection('guilds').get().catch(console.error)
  querySnapshot.forEach(async documentSnapshot => {
    if (!documentSnapshot.exists) return
    if (!GLOBALS.client.guilds.resolve(documentSnapshot.id)) return

    const guildMember = await GLOBALS.client.guilds.resolve(documentSnapshot.id).members.fetch(user).catch(console.error)
    if (!guildMember) return
    if (addRole) guildMember.roles.add(documentSnapshot.get(role))
    else guildMember.roles.remove(documentSnapshot.get(role))
  })
}

const updateUserRankRoles = async (user, rank, GLOBALS) => {
  const querySnapshot = await GLOBALS.db.collection('guilds').get().catch(console.error)
  querySnapshot.forEach(async documentSnapshot => {
    if (!documentSnapshot.exists) return
    if (!GLOBALS.client.guilds.resolve(documentSnapshot.id)) return
    if (!documentSnapshot.get('valorantRankRoles')) return

    const guildMember = await GLOBALS.client.guilds.resolve(documentSnapshot.id).members.fetch(user).catch(console.error)
    if (!guildMember) return
    const allRankRoles = documentSnapshot.get('valorantRankRoles')
    await guildMember.roles.remove(allRankRoles).catch(console.error)
    const rankRole = allRankRoles[rank.toString()[0] - 1]
    guildMember.roles.add(rankRole)
  })
}

/**
 * @param {import('discord.js').Message} userMessage
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const handleUserRegistration = (userRecord, userMessage, GLOBALS) => {
  if (userMessage.channel.type !== 'dm') return

  switch (userRecord.step) {
    case 0:
      if (userMessage.content.match(/\w{3,16}#\w{3,5}/)) userRecord.registrationInformation.valorantUsername = userMessage.content
      else return userMessage.reply('Please give a valid username!').then(msg => msg.delete({ timeout: 5000 }))
      break
    case 1:
      if (!CONSTANTS.RANKS[userMessage.content.toUpperCase()]) {
        return userMessage.reply('Please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        userRecord.registrationInformation.valorantRank = CONSTANTS.RANKS[userMessage.content.toUpperCase()] // TODO: cover edge cases
        updateUserRankRoles(userMessage.author.id, userRecord.registrationInformation.valorantRank, GLOBALS)
        break
      }
    case 2:
      userRecord.registrationInformation.notifications = (CONSTANTS.AFFIRMATIVE_WORDS.includes(userMessage.content.toLowerCase()))
      if (userRecord.registrationInformation.notifications === true) updateUserRoles(userMessage.author.id, 'notificationRole', true, GLOBALS)
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
    GLOBALS.db.collection('users').doc(userRecord.userID).set(userRecord.registrationInformation)
    GLOBALS.activeUserRegistration.delete(userRecord.userID)
  }
}

/**
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
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

/**
 * @param {import('../constants.js').Interaction} interaction
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
async function handleSlashCommandUserRegistration (interaction, GLOBALS) {
  try {
    const user = interaction.member.user.id || interaction.user.id
    if (await GLOBALS.userIsRegistered(user)) throw new Error('User already registered')

    const options = interaction.data.options.reduce((result, item) => {
      result[item.name] = item.value
      return result
    }, {})

    if (!CONSTANTS.RANKS[options.valorantRank.toUpperCase()]) throw new Error('Invalid VALORANT rank')
    if (!options.valorantUsername.match(/\w{3,16}#\w{3,5}/)) throw new Error('Invalid VALORANT username')

    const userInformation = {
      discordID: user,
      matches: [],
      notifications: options.notifications,
      valorantRank: CONSTANTS.RANKS[options.valorantRank.toUpperCase()],
      valorantUsername: options.valorantUsername,
      timestamp: new Date()
    }

    updateUserRankRoles(user, userInformation.valorantRank, GLOBALS)
    if (userInformation.notifications) updateUserRoles(user, 'notificationRole', true, GLOBALS)

    GLOBALS.db.collection('users').doc(user).set(userInformation)

    const embed = new GLOBALS.Embed()
      .setTitle('ScrimBot Registration Complete')
      .setDescription('Thanks for registering! Now it\'s time to get playing!')
      .toJSON()

    GLOBALS.client.api.interactions(interaction.id, interaction.token).callback.post(
      {
        data: {
          type: 4,
          data: {
            embeds: [embed],
            flags: 64
          }
        }
      })
  } catch (error) {
    GLOBALS.client.api.interactions(interaction.id, interaction.token).callback.post(
      {
        data: {
          type: 4,
          data: {
            content: 'Sorry, we encountered an error with the command: `' + error + '` Please try again!',
            flags: 64
          }
        }
      })
  }
}
