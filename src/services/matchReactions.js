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
    reaction.message.channel.send(`${user}, you are not registered with VHT ScrimBot. Please type \`+register\` before reacting!`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  if (matchInformation.players.a.includes(user.id) || matchInformation.players.b.includes(user.id) || (matchInformation.spectators && matchInformation.spectators.includes(user.id))) {
    reaction.message.channel.send(`${user}, you have already joined a team! Please remove that reaction before joining a new one.`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  const messageEmbed = reaction.message.embeds[0]

  const matchUpdateQuery = { $push: {} }

  switch (reaction.emoji.name) {
    case '🇦': // team a
      if (matchInformation.players.a.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`${user}, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
        return
      }
      if (playerInformation.valorantRank < matchInformation.rankMinimum || playerInformation.valorantRank > matchInformation.rankMaximum) {
        reaction.message.channel.send(`${user}, you do not meet the match rank requirements! Please try a different one or ask the match creator to adjust them.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[6].value === 'None' ? messageEmbed.fields[6].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[6].value += `\n• ${playerInformation.valorantUsername}`
        matchUpdateQuery.$push['players.a'] = user.id
      }
      break
    case '🇧': // team b
      if (matchInformation.players.b.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`${user}, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
        return
      }
      if (playerInformation.valorantRank < matchInformation.rankMinimum || playerInformation.valorantRank > matchInformation.rankMaximum) {
        reaction.message.channel.send(`${user}, you do not meet the match rank requirements! Please try a different one or ask the match creator to adjust them.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[7].value === 'None' ? messageEmbed.fields[7].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[7].value += `\n• ${playerInformation.valorantUsername}`
        matchUpdateQuery.$push['players.b'] = user.id
      }
      break
    case '🇸': // spectators
      if (!matchInformation.spectators) {
        reaction.message.channel.send(`${user}, this match does not allow spectators! Either join a team or ask the match creator to start a new one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[8].value === 'None' ? messageEmbed.fields[8].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[8].value += `\n• ${playerInformation.valorantUsername}`
        matchUpdateQuery.$push.spectators = user.id
      }
      break
  }

  reaction.message.edit(messageEmbed)
  return matchUpdateQuery
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
  const matchUpdateQuery = await _addPlayerToMatch(reaction, user, GLOBALS, matchInformation)
  if (matchUpdateQuery) await GLOBALS.mongoDb.collection('matches').updateOne({ _id: reaction.message.id }, matchUpdateQuery)
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

  const matchUpdateQuery = { $pullAll: {} }

  switch (reaction.emoji.name) {
    case '🇦':
      matchUpdateQuery.$pullAll['players.a'] = [user.id]

      messageEmbed.fields[6].value = ''
      for (const playerId of matchInformation.players.a) {
        if (playerId === user.id) continue
        const playerDoc = await GLOBALS.mongoDb.collection('users').findOne({ _id: playerId })
        messageEmbed.fields[6].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[6].value === '') messageEmbed.fields[6].value = 'None'
      break

    case '🇧':
      matchUpdateQuery.$pullAll['players.b'] = [user.id]

      messageEmbed.fields[7].value = ''
      for (const playerId of matchInformation.players.b) {
        if (playerId === user.id) continue
        const playerDoc = await GLOBALS.mongoDb.collection('users').findOne({ _id: playerId })
        messageEmbed.fields[7].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[7].value === '') messageEmbed.fields[7].value = 'None'
      break

    case '🇸':
      if (matchInformation.spectators) {
        matchUpdateQuery.$pullAll.spectators = [user.id]

        messageEmbed.fields[8].value = ''
        for (const playerId of matchInformation.spectators) {
          if (playerId === user.id) continue
          const playerDoc = await GLOBALS.mongoDb.collection('users').findOne({ _id: playerId })
          messageEmbed.fields[8].value += `\n• ${playerDoc.valorantUsername}`
        }
        if (messageEmbed.fields[8].value === '') messageEmbed.fields[8].value = 'None'
      }
      break
  }

  reaction.users.remove(user.id)
  reaction.message.edit(messageEmbed)
  return matchUpdateQuery
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
  const matchUpdateQuery = await _removePlayerFromMatch(reaction, user, GLOBALS, matchInformation)
  if (matchUpdateQuery) await GLOBALS.mongoDb.collection('matches').updateOne({ _id: reaction.message.id }, matchUpdateQuery)
}
