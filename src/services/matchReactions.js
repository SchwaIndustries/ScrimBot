module.exports = exports = {
  name: 'matchReactions',
  enabled: true,
  process: async (GLOBALS) => {
    addOldMessagesToCache(GLOBALS)

    GLOBALS.client.on('messageReactionAdd', (reaction, user) => {
      if (user.bot) return // ignore messages from the bot itself or other bots
      addPlayerToMatch(reaction, user, GLOBALS)
    })
    GLOBALS.client.on('messageReactionRemove', async (reaction, user) => {
      if (user.bot) return // ignore messages from the bot itself or other bots
      removePlayerFromMatch(reaction, user, GLOBALS)
    })
  }
}

const addOldMessagesToCache = async (GLOBALS) => {
  const snapshot = await GLOBALS.db.collection('matches').where('status', '==', 'created').get()
  if (snapshot.empty) return // no open matches found

  snapshot.forEach(async doc => {
    const match = doc.data()

    try {
      const messageChannel = await GLOBALS.client.channels.fetch(match.message.channel)
      messageChannel.messages.fetch(match.message.id)
    } catch (error) {} // The only errors this really gives is when the bot no longer has access to channels
  })
}

const addPlayerToMatch = async (reaction, user, GLOBALS) => {
  const matchInformationRef = GLOBALS.db.collection('matches').doc(reaction.message.id)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return
  matchInformation = matchInformation.data()
  if (matchInformation.status !== 'created') return

  const playerInformationRef = GLOBALS.db.collection('users').doc(user.id)
  let playerInformation = await playerInformationRef.get()
  if (!playerInformation.exists) {
    reaction.message.channel.send(`<@${user.id}>, you are not registered with ScrimBot. Please type \`v!register\` before reacting!`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }
  playerInformation = playerInformation.data()

  if (matchInformation.players.a.find(e => e.id === playerInformationRef.id) || matchInformation.players.b.find(e => e.id === playerInformationRef.id) || (matchInformation.spectators && matchInformation.spectators.find(e => e.id === playerInformationRef.id))) {
    reaction.message.channel.send(`<@${user.id}>, you have already joined a team! Please remove that reaction before joining a new one.`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  if (playerInformation.valorantRank < matchInformation.rankMinimum || playerInformation.valorantRank > matchInformation.rankMaximum) {
    reaction.message.channel.send(`<@${user.id}>, you do not meet the match rank requirements! Please try a different one or ask the match creator to adjust them.`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  const messageEmbed = reaction.message.embeds[0]

  switch (reaction.emoji.name) {
    case '🇦':
      if (matchInformation.players.a.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`<@${user.id}>, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[6].value === 'None' ? messageEmbed.fields[6].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[6].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.players.a.push(playerInformationRef)
        break
      }
    case '🇧':
      if (matchInformation.players.b.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`<@${user.id}>, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[7].value === 'None' ? messageEmbed.fields[7].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[7].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.players.b.push(playerInformationRef)
        break
      }
    case '🇸':
      if (!matchInformation.spectators) {
        reaction.message.channel.send(`<@${user.id}>, this match does not allow spectators! Either join a team or ask the match creator to start a new one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[8].value === 'None' ? messageEmbed.fields[8].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[8].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.spectators.push(playerInformationRef)
        break
      }
  }

  reaction.message.edit(messageEmbed)
  matchInformationRef.update(matchInformation)
}

const removePlayerFromMatch = async (reaction, user, GLOBALS) => {
  const matchInformationRef = GLOBALS.db.collection('matches').doc(reaction.message.id)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return
  matchInformation = matchInformation.data()
  if (matchInformation.status !== 'created') return

  const playerInformationRef = GLOBALS.db.collection('users').doc(user.id)
  let playerInformation = await playerInformationRef.get()
  if (!playerInformation.exists) return
  playerInformation = playerInformation.data()

  const messageEmbed = reaction.message.embeds[0]

  let playersArrayIndex
  switch (reaction.emoji.name) {
    case '🇦':
      playersArrayIndex = matchInformation.players.a.findIndex(e => e.id === playerInformationRef.id)
      if (playersArrayIndex > -1) matchInformation.players.a.splice(playersArrayIndex, 1)

      messageEmbed.fields[6].value = ''
      for (const playerRef of matchInformation.players.a) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        messageEmbed.fields[6].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[6].value === '') messageEmbed.fields[6].value = 'None'
      break
    case '🇧':
      playersArrayIndex = matchInformation.players.b.findIndex(e => e.id === playerInformationRef.id)
      if (playersArrayIndex > -1) matchInformation.players.b.splice(playersArrayIndex, 1)

      messageEmbed.fields[7].value = ''
      for (const playerRef of matchInformation.players.b) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        messageEmbed.fields[7].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[7].value === '') messageEmbed.fields[7].value = 'None'
      break
    case '🇸':
      if (matchInformation.spectators) {
        playersArrayIndex = matchInformation.spectators.findIndex(e => e.id === playerInformationRef.id)
        if (playersArrayIndex > -1) matchInformation.spectators.splice(playersArrayIndex, 1)

        messageEmbed.fields[8].value = ''
        for (const playerRef of matchInformation.spectators) {
          let playerDoc = await playerRef.get()
          playerDoc = playerDoc.data()
          messageEmbed.fields[8].value += `\n• ${playerDoc.valorantUsername}`
        }
        if (messageEmbed.fields[8].value === '') messageEmbed.fields[8].value = 'None'
      }
      break
  }

  reaction.message.edit(messageEmbed)
  matchInformationRef.update(matchInformation)
}
