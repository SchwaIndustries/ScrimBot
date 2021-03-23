module.exports = exports = {
  name: 'matchReactions',
  enabled: true,
  /**
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (GLOBALS) => {
    addOldMessagesToCache(GLOBALS)

    GLOBALS.client.on('messageReactionAdd', (reaction, user) => {
      if (user.bot) return // ignore messages from the bot itself or other bots
      if (['🇦', '🇧', '🇸'].includes(reaction.emoji.name) === false) return // ignore reactions that are not team reactions
      addPlayerToMatch(reaction, user, GLOBALS)
    })
    GLOBALS.client.on('messageReactionRemove', async (reaction, user) => {
      if (user.bot) return // ignore messages from the bot itself or other bots
      if (['🇦', '🇧', '🇸'].includes(reaction.emoji.name) === false) return // ignore reactions that are not team reactions
      removePlayerFromMatch(reaction, user, GLOBALS)
    })
  }
}

/**
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const addOldMessagesToCache = async (GLOBALS) => {
  const snapshot = await GLOBALS.mongoDb.collection('matches').find({ status: 'created' })
  if (!snapshot) return // no open matches found

  snapshot.forEach(async match => {
    try {
      const messageChannel = await GLOBALS.client.channels.fetch(match.message.channel) // grab channel of match message
      await messageChannel.messages.fetch(match.message.id) // grab the match message itself, so that when people react the bot is able to see it
    } catch (error) {} // The only errors this really gives is when the bot no longer has access to channels
  })
}

/**
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const _addPlayerToMatch = async (reaction, user, GLOBALS, matchInformation) => {
  const playerInformation = await GLOBALS.mongoDb.collection('users').findOne({ _id: user.id })
  if (!playerInformation) {
    reaction.message.channel.send(`${user}, you are not registered with ScrimBot. Please type \`v!register\` before reacting!`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  if (matchInformation.players.a.includes(user.id) || matchInformation.players.b.includes(user.id) || (matchInformation.spectators && matchInformation.spectators.includes(user.id))) {
    reaction.message.channel.send(`${user}, you have already joined a team! Please remove that reaction before joining a new one.`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  const messageEmbed = reaction.message.embeds[0]

  switch (reaction.emoji.name) {
    case '🇦': // team a
      if (matchInformation.players.a.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`${user}, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
      }
      if (playerInformation.valorantRank < matchInformation.rankMinimum || playerInformation.valorantRank > matchInformation.rankMaximum) {
        reaction.message.channel.send(`${user}, you do not meet the match rank requirements! Please try a different one or ask the match creator to adjust them.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[6].value === 'None' ? messageEmbed.fields[6].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[6].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.players.a.push(user.id)
        break
      }
    case '🇧': // team b
      if (matchInformation.players.b.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`${user}, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
      }
      if (playerInformation.valorantRank < matchInformation.rankMinimum || playerInformation.valorantRank > matchInformation.rankMaximum) {
        reaction.message.channel.send(`${user}, you do not meet the match rank requirements! Please try a different one or ask the match creator to adjust them.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[7].value === 'None' ? messageEmbed.fields[7].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[7].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.players.b.push(user.id)
        break
      }
    case '🇸': // spectators
      if (!matchInformation.spectators) {
        reaction.message.channel.send(`${user}, this match does not allow spectators! Either join a team or ask the match creator to start a new one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[8].value === 'None' ? messageEmbed.fields[8].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[8].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.spectators.push(user.id)
        break
      }
  }

  reaction.message.edit(messageEmbed)
  return matchInformation
}

/**
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const addPlayerToMatch = async (reaction, user, GLOBALS) => {
  const matchInformation = await GLOBALS.mongoDb.collection('matches').findOne({ _id: reaction.message.id })
  if (!matchInformation) return
  if (matchInformation.status !== 'created') return // only pay attention to matches that are still in the creation phase
  const matchInformationUpdated = await _addPlayerToMatch(reaction, user, GLOBALS, matchInformation)
  if (matchInformationUpdated) await GLOBALS.mongoDb.collection('matches').replaceOne({ _id: reaction.message.id }, matchInformationUpdated)
}

/**
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const _removePlayerFromMatch = async (reaction, user, GLOBALS, matchInformation) => {
  const playerInformation = await GLOBALS.mongoDb.collection('users').findOne({ _id: user.id })
  if (!playerInformation) return

  const messageEmbed = reaction.message.embeds[0]

  let playersArrayIndex
  switch (reaction.emoji.name) {
    case '🇦':
      playersArrayIndex = matchInformation.players.a.indexOf(user.id)
      if (playersArrayIndex > -1) matchInformation.players.a.splice(playersArrayIndex, 1)

      messageEmbed.fields[6].value = ''
      for (const playerId of matchInformation.players.a) {
        const playerDoc = await GLOBALS.mongoDb.collection('users').findOne({ _id: playerId })
        messageEmbed.fields[6].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[6].value === '') messageEmbed.fields[6].value = 'None'
      break
    case '🇧':
      playersArrayIndex = matchInformation.players.b.indexOf(user.id)
      if (playersArrayIndex > -1) matchInformation.players.b.splice(playersArrayIndex, 1)

      messageEmbed.fields[7].value = ''
      for (const playerId of matchInformation.players.b) {
        const playerDoc = await GLOBALS.mongoDb.collection('users').findOne({ _id: playerId })
        messageEmbed.fields[7].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[7].value === '') messageEmbed.fields[7].value = 'None'
      break
    case '🇸':
      if (matchInformation.spectators) {
        playersArrayIndex = matchInformation.spectators.indexOf(user.id)
        if (playersArrayIndex > -1) matchInformation.spectators.splice(playersArrayIndex, 1)

        messageEmbed.fields[8].value = ''
        for (const playerId of matchInformation.spectators) {
          const playerDoc = await GLOBALS.mongoDb.collection('users').findOne({ _id: playerId })
          messageEmbed.fields[8].value += `\n• ${playerDoc.valorantUsername}`
        }
        if (messageEmbed.fields[8].value === '') messageEmbed.fields[8].value = 'None'
      }
      break
  }

  reaction.users.remove(user.id)
  reaction.message.edit(messageEmbed)
  return matchInformation
}

/**
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const removePlayerFromMatch = async (reaction, user, GLOBALS) => {
  const matchInformation = await GLOBALS.mongoDb.collection('matches').findOne({ _id: reaction.message.id })
  if (!matchInformation) return
  if (matchInformation.status !== 'created') return
  const matchInformationUpdated = await _removePlayerFromMatch(reaction, user, GLOBALS, matchInformation)
  if (matchInformationUpdated) await GLOBALS.mongoDb.collection('matches').replaceOne({ _id: reaction.message.id }, matchInformationUpdated)
}
