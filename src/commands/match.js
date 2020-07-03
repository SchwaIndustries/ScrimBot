const CONSTANTS = require('../constants')
const moment = require('moment-timezone')
const admin = require('firebase-admin')

module.exports = exports = {
  name: 'match',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    switch (message.content.split(' ')[1]) {
      case 'create': create(message, GLOBALS); break
      case 'start': start(message, GLOBALS); break
      case 'score': score(message, GLOBALS); break
      case 'cancel': cancel(message, GLOBALS); break
      case 'info': info(message, GLOBALS); break
      case 'edit': edit(message, GLOBALS); break
    }
  }
}

const create = async (message, GLOBALS) => {
  if (!message.guild) return message.reply('This command can only be run in a server!')
  const playerInformation = await GLOBALS.db.collection('users').doc(message.author.id).get()
  if (!playerInformation.exists) {
    message.reply('You are not registered with ScrimBot. Please type `v!register` before creating a match!')
    return
  }

  const playerPunishInformation = await GLOBALS.db.collection('users').doc(message.author.id).collection('punishments').get()
  if (playerPunishInformation.docs.length > 0 && (playerPunishInformation.docs.slice(-1).pop().data().unbanDate.toMillis()) > Date.now()) {
    message.channel.send(`<@${message.author.id}>, you are currently banned. Please wait for your ban to expire before creating a match.`).then(msg => msg.delete({ timeout: 5000 }))
    return
  }

  const embed = new GLOBALS.Embed()
    .setTitle('Create a Match')
    .setDescription('Let\'s start a match!')
    .setAuthor(message.author.tag, message.author.avatarURL())
    .addField(CONSTANTS.matchCreationSteps[0][0], CONSTANTS.matchCreationSteps[0][1])

  const creationMessage = await message.channel.send(embed)
  const reaction = await creationMessage.react('❌')
  GLOBALS.activeMatchCreation.set(message.author.id, {
    step: 0,
    botMessage: creationMessage,
    botReaction: reaction,
    userID: message.author.id,
    userMessage: message,
    creationInformation: {
      players: { a: [], b: [] },
      spectators: false,
      map: 0,
      rankMinimum: '',
      rankMaximum: '',
      date: undefined,
      creator: message.author.id,
      status: 'created'
    }
  }) // add user to the list of users who are currently creating a match, and set their progress to 0 (none)
}

const start = async (message, GLOBALS) => {
  const matchID = message.content.split(' ')[2]
  if (!message.guild) return message.reply('This command can only be run in a server!')
  if (!matchID) return message.reply('Match not found! Ensure correct match ID is submitted.')
  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  matchInformation = matchInformation.data()

  const adminUser = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()

  if (!adminUser.exists && message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to start the match.')

  if (matchInformation.players.a.length === 0 || matchInformation.players.b.length === 0) return message.reply('There are not enough players in the match!')

  matchInformation.status = 'started'

  const botMessageChannel = await GLOBALS.client.channels.fetch(matchInformation.message.channel)
  const botMessage = await botMessageChannel.messages.fetch(matchID)
  const botMessageEmbed = botMessage.embeds[0]
  botMessageEmbed.fields[0].value = CONSTANTS.capitalizeFirstLetter(matchInformation.status)
  botMessage.edit('The match has started!', botMessageEmbed)
  if (message.guild.me.hasPermission('MANAGE_MESSAGES')) botMessage.reactions.removeAll()

  if (message.guild.me.hasPermission('MANAGE_CHANNELS')) {
    const teamAPermissionOverrides = matchInformation.players.a.map(p => {
      return {
        id: p.id,
        allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'USE_VAD']
      }
    })
    const teamBPermissionOverrides = matchInformation.players.b.map(p => {
      return {
        id: p.id,
        allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'USE_VAD']
      }
    })

    const teamAVoiceChannel = await botMessageChannel.guild.channels.create(`Team A: ${matchID.slice(-4)}`, {
      type: 'voice',
      userLimit: matchInformation.players.a.length,
      parent: botMessageChannel.parent,
      permissionOverrides: teamAPermissionOverrides
    })
    const teamBVoiceChannel = await botMessageChannel.guild.channels.create(`Team B: ${matchID.slice(-4)}`, {
      type: 'voice',
      userLimit: matchInformation.players.b.length,
      parent: botMessageChannel.parent,
      permissionOverrides: teamBPermissionOverrides
    })

    matchInformation.teamAVoiceChannel = teamAVoiceChannel.id
    matchInformation.teamBVoiceChannel = teamBVoiceChannel.id

    if (message.guild.me.hasPermission('MOVE_MEMBERS')) {
      const teamAMembers = await message.guild.members.fetch({
        user: matchInformation.players.a.map(p => p.id)
      })

      const teamBMembers = await message.guild.members.fetch({
        user: matchInformation.players.b.map(p => p.id)
      })

      teamAMembers.each(player => {
        player.voice.setChannel(teamAVoiceChannel).catch()
      })
      teamBMembers.each(player => {
        player.voice.setChannel(teamBVoiceChannel).catch()
      })
    }
  }

  matchInformationRef.update(matchInformation)

  const embed = new GLOBALS.Embed()
    .setTitle('Match Started')
    .setDescription('Match with ID `' + matchID + '` has been started. Once complete, use `v!match score <match id> <score>` to report the score!')
    .setFooter('This message will self-destruct in 30 seconds.')
  message.reply(embed).then(msg => {
    msg.delete({ timeout: 30000 })
    message.delete({ timeout: 30000 })
  })
}

const score = async (message, GLOBALS) => {
  const matchID = message.content.split(' ')[2]
  const matchScore = message.content.split(' ')[3]
  if (!message.guild) return message.reply('This command can only be run in a server!')

  if (/\d{1,2}-\d{1,2}/.test(matchScore) === false) return message.reply('Ensure your score is reported in the format `<team a>-<team b>` (e.g. `13-7`)')

  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  matchInformation = matchInformation.data()

  const adminUser = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()

  if (!adminUser.exists && message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to score the match.')

  if (message.guild.me.hasPermission('MANAGE_CHANNELS')) {
    GLOBALS.client.channels.fetch(matchInformation.teamAVoiceChannel).then(c => c.delete())
    GLOBALS.client.channels.fetch(matchInformation.teamBVoiceChannel).then(c => c.delete())
  }

  matchInformation.status = 'completed'
  matchInformation.score = [matchScore.split('-')[0], matchScore.split('-')[1]]
  matchInformation.teamAVoiceChannel = admin.firestore.FieldValue.delete()
  matchInformation.teamBVoiceChannel = admin.firestore.FieldValue.delete()

  matchInformationRef.update(matchInformation)

  const embed = new GLOBALS.Embed()
    .setTitle('Match Completed')
    .setDescription('Match with ID `' + matchID + '` has been completed. Thanks for using ScrimBot, to create a new match type `v!match create`')
    .setFooter('This message will self-destruct in 30 seconds.')
  message.reply(embed).then(msg => {
    msg.delete({ timeout: 30000 })
    message.delete({ timeout: 30000 })
  })

  const botMessageChannel = await GLOBALS.client.channels.fetch(matchInformation.message.channel)
  const botMessage = await botMessageChannel.messages.fetch(matchID)
  const botMessageEmbed = botMessage.embeds[0]
  botMessageEmbed.fields[0].value = CONSTANTS.capitalizeFirstLetter(matchInformation.status)
  botMessageEmbed.addField('Final Score', matchScore)
  botMessage.edit(botMessageEmbed)
  if (message.guild.me.hasPermission('MANAGE_MESSAGES')) botMessage.reactions.removeAll()

  for (const playerRef of matchInformation.players.a) {
    let playerDoc = await playerRef.get()
    playerDoc = playerDoc.data()
    playerDoc.matches.unshift(matchInformationRef)
    playerRef.update(playerDoc)
  }
  for (const playerRef of matchInformation.players.b) {
    let playerDoc = await playerRef.get()
    playerDoc = playerDoc.data()
    playerDoc.matches.unshift(matchInformationRef)
    playerRef.update(playerDoc)
  }
  if (matchInformation.spectators instanceof Array) {
    for (const playerRef of matchInformation.spectators) {
      let playerDoc = await playerRef.get()
      playerDoc = playerDoc.data()
      playerDoc.matches.unshift(matchInformationRef)
      playerRef.update(playerDoc)
    }
  }
}

const cancel = async (message, GLOBALS) => {
  const matchID = message.content.split(' ')[2]
  if (!message.guild) return message.reply('This command can only be run in a server!')

  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  matchInformation = matchInformation.data()

  const adminUser = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()

  if (!adminUser.exists && message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to cancel the match.')

  if (matchInformation.status === 'scored') return message.reply('This match has already been scored.')

  if (matchInformation.status === 'started') {
    if (!adminUser.exists) return message.reply('**__You must be a ScrimBot admin to cancel an ongoing match.__**')
  }

  matchInformation.status = 'canceled'

  matchInformationRef.update(matchInformation)

  const embed = new GLOBALS.Embed()
    .setTitle('Match Canceled')
    .setDescription('Match with ID `' + matchID + '` has been canceled. Thanks for using ScrimBot, to create a new match type `v!match create`')
    .setFooter('This message will self-destruct in 30 seconds.')
  message.reply(embed).then(msg => msg.delete({ timeout: 30000 }))

  const botMessageChannel = await GLOBALS.client.channels.fetch(matchInformation.message.channel)
  const botMessage = await botMessageChannel.messages.fetch(matchID)
  const botMessageEmbed = botMessage.embeds[0]
  botMessageEmbed.fields[0].value = CONSTANTS.capitalizeFirstLetter(matchInformation.status)
  botMessage.edit(botMessageEmbed)
  if (message.guild.me.hasPermission('MANAGE_MESSAGES')) botMessage.reactions.removeAll()
}

const info = async (message, GLOBALS) => {
  const matchID = message.content.split(' ')[2]

  if (!matchID) return message.reply('Match not found! Ensure correct match ID is submitted.')
  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  matchInformation = matchInformation.data()

  const matchCreator = await GLOBALS.client.users.fetch(matchInformation.creator)

  const matchEmbed = new GLOBALS.Embed()
    .setTitle('Retrieved Match Information')
    .setDescription('')
    .setTimestamp(matchInformation.date.toDate())
    .setAuthor(matchCreator.tag, matchCreator.avatarURL())
    .setThumbnail(CONSTANTS.MAPS_THUMBNAILS[matchInformation.map])
    .addField('Status', CONSTANTS.capitalizeFirstLetter(matchInformation.status), true)
    .addField('Date', moment(matchInformation.date.toMillis()).tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('h:mm a z DD MMM, YYYY'), true)
    .addField('Map', CONSTANTS.capitalizeFirstLetter(matchInformation.map), true)
    .addField('Max Team Count', matchInformation.maxTeamCount, true)
    .addField('Minimum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchInformation.rankMinimum]), true)
    .addField('Maximum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchInformation.rankMaximum]), true)
    .addField('Team A', 'None', true)
    .addField('Team B', 'None', true)
    .addField('Spectators', matchInformation.spectators instanceof Array ? 'None' : 'Not allowed', true)
  matchEmbed.fields[6].value = ''
  for (const playerRef of matchInformation.players.a) {
    let playerDoc = await playerRef.get()
    playerDoc = playerDoc.data()
    matchEmbed.fields[6].value += `\n• ${playerDoc.valorantUsername}`
  }
  if (matchEmbed.fields[6].value === '') matchEmbed.fields[6].value = 'None'

  matchEmbed.fields[7].value = ''
  for (const playerRef of matchInformation.players.b) {
    let playerDoc = await playerRef.get()
    playerDoc = playerDoc.data()
    matchEmbed.fields[7].value += `\n• ${playerDoc.valorantUsername}`
  }
  if (matchEmbed.fields[7].value === '') matchEmbed.fields[7].value = 'None'

  if (matchInformation.spectators instanceof Array) {
    matchEmbed.fields[8].value = ''
    for (const playerRef of matchInformation.spectators) {
      let playerDoc = await playerRef.get()
      playerDoc = playerDoc.data()
      matchEmbed.fields[8].value += `\n• ${playerDoc.valorantUsername}`
    }
    if (matchEmbed.fields[8].value === '') matchEmbed.fields[8].value = 'None'
  }

  if (matchInformation.status === 'completed') {
    matchEmbed.addField('Final Score', `${matchInformation.score[0]}-${matchInformation.score[1]}`)
  }
  message.reply(matchEmbed)
}

const edit = async (message, GLOBALS) => {
  const attributes = message.content.split(' ')
  const matchID = attributes[2]
  if (!matchID) return message.reply('Please specify a match id to edit!')

  const editedProperty = attributes[3]
  if (!editedProperty) return message.reply('Please specify a property to edit! (date, map, minRank, maxRank, teamPlayerCount, spectators)')

  const editedValue = attributes[4]
  if (!editedValue) return message.reply('Please specify a value for ' + editedProperty)

  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  matchInformation = matchInformation.data()
  const botMessageChannel = await GLOBALS.client.channels.fetch(matchInformation.message.channel)
  const botMessage = await botMessageChannel.messages.fetch(matchID)
  const matchEmbed = botMessage.embeds[0]

  switch (editedProperty) {
    case 'date': {
      const dateString = [editedValue, ...attributes.slice(5)]
      if (dateString.length === 2) {
        const actualDate = moment().tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('YYYY-MM-DD')
        dateString.push(actualDate)
      }

      const date = moment.tz(dateString.join(' '), 'h:mm a YYYY-MM-DD', process.env.TIME_ZONE || 'America/Los_Angeles').toDate()
      if (isNaN(date)) return message.reply('please give a valid date!').then(msg => msg.delete({ timeout: 5000 }))
      matchInformation.date = date

      matchEmbed.fields[1].value = moment(matchInformation.date).tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('h:mm a z DD MMM, YYYY')
      matchEmbed.setTimestamp(matchInformation.date)
      break
    }
    case 'minRank': {
      if (editedValue.toLowerCase() === 'any') {
        matchInformation.rankMinimum = 0
      } else if (!CONSTANTS.RANKS[editedValue.toUpperCase()]) {
        return message.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchInformation.rankMinimum = CONSTANTS.RANKS[editedValue.toUpperCase()] // TODO: cover edge cases
      }
      matchEmbed.fields[4].value = CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchInformation.rankMinimum])
      break
    }
    case 'maxRank': {
      if (editedValue.toLowerCase() === 'any') {
        matchInformation.rankMaximum = 99
      } else if (!CONSTANTS.RANKS[editedValue.toUpperCase()]) {
        return message.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else if (CONSTANTS.RANKS[editedValue.toUpperCase()] < matchInformation.rankMinimum) {
        return message.reply('the maximum rank cannot be below the minimum rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchInformation.rankMaximum = CONSTANTS.RANKS[editedValue.toUpperCase()] // TODO: cover edge cases
      }
      matchEmbed.fields[5].value = CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchInformation.rankMaximum])
      break
    }
    case 'teamPlayerCount': {
      if (!Number(editedValue) || Number(editedValue) > 5) {
        return message.reply('please give a valid number!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchInformation.maxTeamCount = Number(editedValue)
        matchEmbed.fields[3].value = matchInformation.maxTeamCount + ' players per team'
        break
      }
    }
    case 'spectators':
      matchInformation.spectators = (CONSTANTS.AFFIRMATIVE_WORDS.includes(editedValue.toLowerCase())) ? [] : false
      matchEmbed.fields[8].value = matchInformation.spectators instanceof Array ? 'None' : 'Not allowed'
      break
    case 'map': {
      if (editedValue.toLowerCase() === 'any') {
        matchInformation.map = CONSTANTS.MAPS[Math.floor(Math.random() * Math.floor(CONSTANTS.MAPS.length))]
      } else if (isNaN(editedValue) || Number(editedValue) > CONSTANTS.MAPS.length) {
        return message.reply('please give a valid number!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchInformation.map = CONSTANTS.MAPS[Number(editedValue - 1)]
      }
      matchEmbed.fields[2].value = CONSTANTS.capitalizeFirstLetter(matchInformation.map)
      matchEmbed.setThumbnail(CONSTANTS.MAPS_THUMBNAILS[matchInformation.map])
      break
    }
    default:
      return message.reply('Property `' + editedProperty + '` not found! Please try again using a valid property (date, map, minRank, maxRank, teamPlayerCount, spectators).')
  }

  matchInformationRef.update(matchInformation)
  message.reply(`${editedProperty} successfully changed to ${editedValue} for match ${matchID}!`)
  botMessage.edit(matchEmbed)
}
