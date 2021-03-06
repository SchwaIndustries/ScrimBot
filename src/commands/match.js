const CONSTANTS = require('../constants')
const moment = require('moment-timezone')
const admin = require('firebase-admin')

module.exports = exports = {
  name: 'match',
  usage: '',
  enabled: true,
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
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

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const create = async (message, GLOBALS) => {
  if (!message.guild) return message.reply('This command can only be run in a server!')
  if (await GLOBALS.userIsRegistered(message.author.id) === false) {
    message.reply('You are not registered with ScrimBot. Please type `v!register` before creating a match!')
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

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const start = async (message, GLOBALS) => {
  const matchID = message.content.split(' ')[2]
  if (!message.guild) return message.reply('This command can only be run in a server!')
  if (!matchID) return message.reply('Match not found! Ensure correct match ID is submitted.')
  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  if (matchInformation.status === 'scored') return message.reply('This match has already been completed.')
  matchInformation = matchInformation.data()

  if (await GLOBALS.userIsAdmin(message.author.id) === false && message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to start the match.')

  if (matchInformation.players.a.length === 0 || matchInformation.players.b.length === 0) return message.reply('There are not enough players in the match!')

  matchInformation.status = 'started'

  /**
   * @type {import('discord.js').TextChannel}
   */
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

    /**
     * @type {import('discord.js').VoiceChannel}
     */
    const teamAVoiceChannel = await botMessageChannel.guild.channels.create(`Team A: ${matchID.slice(-4)}`, {
      type: 'voice',
      userLimit: matchInformation.players.a.length + (matchInformation.spectators.length || 0),
      parent: botMessageChannel.parent,
      permissionOverrides: teamAPermissionOverrides
    })
    /**
     * @type {import('discord.js').VoiceChannel}
     */
    const teamBVoiceChannel = await botMessageChannel.guild.channels.create(`Team B: ${matchID.slice(-4)}`, {
      type: 'voice',
      userLimit: matchInformation.players.b.length + (matchInformation.spectators.length || 0),
      parent: botMessageChannel.parent,
      permissionOverrides: teamBPermissionOverrides
    })

    matchInformation.teamAVoiceChannel = teamAVoiceChannel.id
    matchInformation.teamBVoiceChannel = teamBVoiceChannel.id

    const teamAInvite = await teamAVoiceChannel.createInvite({ maxAge: 3600 })
    const teamBInvite = await teamBVoiceChannel.createInvite({ maxAge: 3600 })

    const teamAEmbed = new GLOBALS.Embed()
      .setTitle('Match Starting!')
      .setDescription(`Your match in ${message.guild.name} is starting now! Click [here](${teamAInvite.url}) to join the voice channel.`)
    const teamBEmbed = new GLOBALS.Embed()
      .setTitle('Match Starting!')
      .setDescription(`Your match in ${message.guild.name} is starting now! Click [here](${teamBInvite.url}) to join the voice channel.`)

    /**
     * @type {import('discord.js').Collection<import('discord.js').Snowflake,import('discord.js').GuildMember>}
     */
    const teamAMembers = await message.guild.members.fetch({
      user: matchInformation.players.a.map(p => p.id)
    })
    const teamBMembers = await message.guild.members.fetch({
      user: matchInformation.players.b.map(p => p.id)
    })

    if (message.guild.me.hasPermission('MOVE_MEMBERS')) {
      teamAMembers.each(player => {
        player.voice.setChannel(teamAVoiceChannel, 'ScrimBot match starting')
          .catch(_ => {
            player.createDM()
            player.send(teamAEmbed)
          })
      })
      teamBMembers.each(player => {
        player.voice.setChannel(teamBVoiceChannel, 'ScrimBot match starting')
          .catch(_ => {
            player.createDM()
            player.send(teamBEmbed)
          })
      })
    } else {
      teamAMembers.each(player => {
        player.createDM()
        player.send(teamAEmbed)
      })
      teamBMembers.each(player => {
        player.createDM()
        player.send(teamBEmbed)
      })
    }

    if (matchInformation.spectators) {
      const spectatorMembers = await message.guild.members.fetch({
        user: matchInformation.spectators.map(p => p.id)
      })

      const spectatorEmbed = new GLOBALS.Embed()
        .setTitle('Match Starting!')
        .setDescription(`Your match in ${message.guild.name} is starting now!`)
        .addField('Team A', `Click [here](${teamAInvite.url}) to join the team A voice channel.`)
        .addField('Team B', `Click [here](${teamBInvite.url}) to join the team B voice channel.`)

      spectatorMembers.each(player => {
        player.createDM()
        player.send(spectatorEmbed)
      })
    }
  }

  matchInformationRef.update(matchInformation)

  const embed = new GLOBALS.Embed()
    .setTitle('Match Started')
    .setDescription('Match with ID `' + matchID + '` has been started. Once complete, use `v!match score <match id> <score>` to report the score!')
    .setFooter('This message will self-destruct in 30 seconds.')
  if (!message.guild.me.hasPermission('MANAGE_CHANNELS')) embed.addField('Note', 'If you give ScrimBot the `Manage Channels` and `Move Members` permissions, it can automatically create voice channels for each team and move players into them!')
  message.reply(embed).then(msg => {
    msg.delete({ timeout: 30000 })
    message.delete({ timeout: 30000 })
  })
}

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const score = async (message, GLOBALS) => {
  const matchID = message.content.split(' ')[2]
  const matchScore = message.content.split(' ')[3]
  if (!message.guild) return message.reply('This command can only be run in a server!')

  if (/\d{1,2}-\d{1,2}/.test(matchScore) === false) return message.reply('Ensure your score is reported in the format `<team a>-<team b>` (e.g. `13-7`)')

  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  if (matchInformation.status === 'created') return message.reply('This match has not been started yet!')
  if (matchInformation.status === 'completed') return message.reply('This match has already been scored. Please ask a bot admin to change the score in the database if changes are required.')
  matchInformation = matchInformation.data()

  if (await GLOBALS.userIsAdmin(message.author.id) === false && message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to score the match.')

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
  botMessage.edit('The match has completed!', botMessageEmbed)
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

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const cancel = async (message, GLOBALS) => {
  const matchID = message.content.split(' ')[2]
  if (!message.guild) return message.reply('This command can only be run in a server!')

  const matchInformationRef = GLOBALS.db.collection('matches').doc(matchID)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
  matchInformation = matchInformation.data()

  if (await GLOBALS.userIsAdmin(message.author.id) === false && message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to cancel the match.')

  if (matchInformation.status === 'scored') return message.reply('This match has already been scored.')

  if (matchInformation.status === 'started' && message.guild.me.hasPermission('MANAGE_CHANNELS')) {
    GLOBALS.client.channels.fetch(matchInformation.teamAVoiceChannel).then(c => c.delete())
    GLOBALS.client.channels.fetch(matchInformation.teamBVoiceChannel).then(c => c.delete())
  }

  matchInformation.status = 'canceled'

  matchInformationRef.update(matchInformation)

  const embed = new GLOBALS.Embed()
    .setTitle('Match Cancelled')
    .setDescription('Match with ID `' + matchID + '` has been cancelled. Thanks for using ScrimBot, to create a new match type `v!match create`')
    .setFooter('This message will self-destruct in 30 seconds.')
  message.reply(embed).then(msg => {
    msg.delete({ timeout: 30000 })
    message.delete({ timeout: 30000 })
  })

  const botMessageChannel = await GLOBALS.client.channels.fetch(matchInformation.message.channel)
  const botMessage = await botMessageChannel.messages.fetch(matchID)
  const botMessageEmbed = botMessage.embeds[0]
  botMessageEmbed.fields[0].value = CONSTANTS.capitalizeFirstLetter(matchInformation.status)
  botMessage.edit('The match has been cancelled!', botMessageEmbed)
  if (message.guild.me.hasPermission('MANAGE_MESSAGES')) botMessage.reactions.removeAll()
}

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
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
    .addField('Game Mode', CONSTANTS.capitalizeFirstLetter(matchInformation.mode || 'standard'), true)
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

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const edit = async (message, GLOBALS) => {
  const attributes = message.content.split(' ')
  const matchID = attributes[2]
  if (!matchID) return message.reply('Please specify a match id to edit!')

  const editedProperty = attributes[3]
  if (!editedProperty) return message.reply('Please specify a property to edit! (date, map, minRank, maxRank, teamPlayerCount, spectators, mode)')

  const editedValue = attributes.slice(4).join(' ')
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
      const dateString = editedValue.split(' ')
      if (dateString.length === 2) {
        const actualDate = moment().tz(process.env.TIME_ZONE).format('YYYY-MM-DD')
        dateString.push(actualDate)
      }

      const date = moment.tz(dateString.join(' '), 'h:mm a YYYY-MM-DD', process.env.TIME_ZONE).toDate()
      if (isNaN(date)) return message.reply('please give a valid date!').then(msg => msg.delete({ timeout: 5000 }))
      matchInformation.date = date

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
      } else if (CONSTANTS.MAPS.includes(editedValue.toLowerCase())) {
        matchInformation.map = CONSTANTS.MAPS.find(e => e === editedValue.toLowerCase()) ?? editedValue.toLowerCase()
      } else {
        return userMessage.reply('please give a valid map!').then(msg => msg.delete({ timeout: 5000 }))
      }
      matchEmbed.fields[2].value = CONSTANTS.capitalizeFirstLetter(matchInformation.map)
      matchEmbed.setThumbnail(CONSTANTS.MAPS_THUMBNAILS[matchInformation.map])
      break
    }
    case 'mode': {
      if (CONSTANTS.GAME_MODES.includes(editedValue.toLowerCase())) {
        matchInformation.mode = editedValue.toLowerCase()
        matchEmbed.fields[1].value = GLOBALS.capitalizeFirstLetter(matchInformation.mode.toLowerCase())
      } else {
        return message.reply('please give a valid game mode!').then(msg => msg.delete({ timeout: 5000 }))
      }
      break
    }
    default:
      return message.reply('Property `' + editedProperty + '` not found! Please try again using a valid property (date, map, minRank, maxRank, teamPlayerCount, spectators, mode).')
  }

  matchInformationRef.update(matchInformation)
  message.reply(`${editedProperty} successfully changed to ${editedValue} for match ${matchID}!`)
  botMessage.edit(matchEmbed)
}
