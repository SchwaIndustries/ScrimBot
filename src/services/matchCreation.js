const CONSTANTS = require('../constants')
const moment = require('moment-timezone')
const chrono = require('chrono-node')

module.exports = exports = {
  name: 'matchCreation',
  enabled: true,
  /**
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (GLOBALS) => {
    GLOBALS.client.on('message', async message => {
      if (message.author === GLOBALS.client.user || message.author.bot === true) return // ignore messages from the bot itself or other bots
      if (GLOBALS.activeMatchCreation.has(message.author.id)) handleMatchCreation(GLOBALS.activeMatchCreation.get(message.author.id), message, GLOBALS)
    })
    GLOBALS.client.on('messageReactionAdd', (reaction, user) => {
      if (user.bot) return // ignore messages from the bot itself or other bots
      if (GLOBALS.activeMatchCreation.has(user.id)) cancelMatchCreation(reaction, user, GLOBALS)
    })
    GLOBALS.client.ws.on('INTERACTION_CREATE', async interaction => {
      if (interaction.data.name !== 'matchcreate') return
      await handleSlashCommandMatchCreation(interaction, GLOBALS)
    })
  }
}

const handleMatchCreation = async (matchRecord, userMessage, GLOBALS) => {
  if (userMessage.channel !== matchRecord.botMessage.channel) return

  if (userMessage.guild.me.hasPermission('MANAGE_MESSAGES')) userMessage.delete({ timeout: 500 })
  const content = userMessage.content.toLowerCase()
  switch (matchRecord.step) {
    case 0: {
      const date = chrono.parseDate(`${userMessage.content} ${moment.tz.zone(process.env.TIME_ZONE).abbr(Date.now())}`)
      if (!date) return userMessage.reply('please give a valid date!').then(msg => msg.delete({ timeout: 5000 }))
      matchRecord.creationInformation.date = date
      break
    }

    case 1: {
      if (content === 'any') {
        matchRecord.creationInformation.rankMinimum = 0
        break
      } else if (!CONSTANTS.RANKS[userMessage.content.toUpperCase()]) {
        return userMessage.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchRecord.creationInformation.rankMinimum = CONSTANTS.RANKS[userMessage.content.toUpperCase()] // TODO: cover edge cases
        break
      }
    }

    case 2: {
      if (content === 'any') {
        matchRecord.creationInformation.rankMaximum = 99
        break
      } else if (!CONSTANTS.RANKS[userMessage.content.toUpperCase()]) {
        return userMessage.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else if (CONSTANTS.RANKS[userMessage.content.toUpperCase()] < matchRecord.creationInformation.rankMinimum) {
        return userMessage.reply('the maximum rank cannot be below the minimum rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchRecord.creationInformation.rankMaximum = CONSTANTS.RANKS[userMessage.content.toUpperCase()] // TODO: cover edge cases
        break
      }
    }

    case 3: {
      if (!Number(content)) {
        return userMessage.reply('please give a valid number!').then(msg => msg.delete({ timeout: 5000 }))
      } else if (Number(content) > CONSTANTS.MAX_TEAM_COUNT || Number(content) < 1) {
        return userMessage.reply('that number does not fit the amount of players allowed on a team, which is ' + CONSTANTS.MAX_TEAM_COUNT).then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchRecord.creationInformation.maxTeamCount = Number(content)
        break
      }
    }

    case 4:
      matchRecord.creationInformation.spectators = (CONSTANTS.AFFIRMATIVE_WORDS.includes(content)) ? [] : false
      break

    case 5: {
      if (content === 'any') {
        matchRecord.creationInformation.map = CONSTANTS.MAPS[Math.floor(Math.random() * Math.floor(CONSTANTS.MAPS.length))]
        break
      } else if (CONSTANTS.MAPS.includes(content)) {
        matchRecord.creationInformation.map = CONSTANTS.MAPS.find(e => e === content) ?? content
        break
      } else {
        return userMessage.reply('please give a valid map!').then(msg => msg.delete({ timeout: 5000 }))
      }
    }

    case 6: {
      if (CONSTANTS.GAME_MODES.includes(content)) {
        matchRecord.creationInformation.mode = CONSTANTS.GAME_MODES.find(e => e === content) ?? content
        break
      } else {
        return userMessage.reply('please give a valid game mode!').then(msg => msg.delete({ timeout: 5000 }))
      }
    }
  }

  if (matchRecord.step < CONSTANTS.matchCreationSteps.length - 1) {
    const embed = matchRecord.botMessage.embeds[0]

    const previousField = embed.fields[matchRecord.step]
    previousField.name = '✅ ' + previousField.name

    matchRecord.step = matchRecord.step + 1

    const stepInfo = CONSTANTS.matchCreationSteps[matchRecord.step]
    embed.addField(stepInfo[0], stepInfo[1])
    matchRecord.botMessage.edit(embed)

    GLOBALS.activeMatchCreation.set(matchRecord.userID, matchRecord)
  } else {
    const embed = new GLOBALS.Embed()
      .setAuthor(userMessage.author.tag, userMessage.author.avatarURL())
      .setTitle('Match Creation Complete')
      .setDescription('Your match has been made! To start it, type `v!match start <match id>`')
      .setFooter('This message will self-destruct in 30 seconds.')
    matchRecord.botMessage.edit(embed)
    matchRecord.botMessage.delete({ timeout: 30000 })
    if (userMessage.guild.me.hasPermission('MANAGE_MESSAGES')) matchRecord.botMessage.reactions.removeAll()
    else matchRecord.botReaction.remove()
    matchRecord.creationInformation.timestamp = new Date()

    let guildInformation = await GLOBALS.db.collection('guilds').doc(userMessage.guild.id).get()
    if (!guildInformation.exists) guildInformation.notificationRole = userMessage.guild.id
    else guildInformation = guildInformation.data()

    const matchEmbed = new GLOBALS.Embed()
      .setTitle('Match Information')
      .setDescription('React with 🇦 to join the A team, react with 🇧 to join the B team' + (matchRecord.creationInformation.spectators instanceof Array ? ', and react with 🇸 to be a spectator.' : '.'))
      .setThumbnail(CONSTANTS.MAPS_THUMBNAILS[matchRecord.creationInformation.map])
      .setTimestamp(matchRecord.creationInformation.date)
      .setAuthor(userMessage.author.tag, userMessage.author.avatarURL())
      .addField('Status', CONSTANTS.capitalizeFirstLetter(matchRecord.creationInformation.status), true)
      .addField('Game Mode', CONSTANTS.capitalizeFirstLetter(matchRecord.creationInformation.mode), true)
      .addField('Map', CONSTANTS.capitalizeFirstLetter(matchRecord.creationInformation.map), true)
      .addField('Max Team Count', matchRecord.creationInformation.maxTeamCount + ' players per team', true)
      .addField('Minimum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchRecord.creationInformation.rankMinimum]), true)
      .addField('Maximum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchRecord.creationInformation.rankMaximum]), true)
      .addField('Team A', 'None', true)
      .addField('Team B', 'None', true)
      .addField('Spectators', matchRecord.creationInformation.spectators instanceof Array ? 'None' : 'Not allowed', true)
    matchRecord.botMessage.channel.send(`A match has been created! <@&${guildInformation.notificationRole}>`, matchEmbed)
      .then(async message => {
        message.react('🇦')
        message.react('🇧')
        if (matchRecord.creationInformation.spectators) message.react('🇸')
        matchEmbed.setFooter('match id: ' + message.id)
        message.edit(matchEmbed)
        matchRecord.userMessage.delete()
        matchRecord.creationInformation.message = {
          id: message.id,
          channel: message.channel.id
        }
        await GLOBALS.db.collection('matches').doc(message.id).set(matchRecord.creationInformation)
        GLOBALS.db.collection('guilds').doc(message.guild.id).collection('matches').doc(message.id).set({ data: GLOBALS.db.collection('matches').doc(message.id) })
        GLOBALS.activeMatchCreation.delete(matchRecord.userID)
      })
  }
}

const cancelMatchCreation = async (reaction, user, GLOBALS) => {
  if (reaction.emoji.name === '❌') {
    const userRecord = GLOBALS.activeMatchCreation.get(user.id)
    const embed = new GLOBALS.Embed()
      .setTitle('ScrimBot Match Creation Cancelled')
      .setDescription('Your Match Creation has been cancelled. If you want to try again, just type v!match create.')
    userRecord.botMessage.edit(embed)
    GLOBALS.activeMatchCreation.delete(userRecord.userID)
    reaction.remove()
  }
}

/**
 * @param {import('../constants.js').Interaction} interaction
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
async function handleSlashCommandMatchCreation (interaction, GLOBALS) {
  if (!interaction.member) {
    return GLOBALS.client.api.interactions(interaction.id, interaction.token).callback.post({
      data: {
        type: 4,
        data: {
          content: 'This command can only be run in a server!',
          flags: 64
        }
      }
    })
  }
  const options = interaction.data.options.reduce((result, item) => {
    result[item.name] = item.value
    return result
  }, {})

  const matchInformation = {
    creator: GLOBALS.db.collection('users').doc(interaction.member.user.id),
    date: chrono.parseDate(`${options.date} ${moment.tz.zone(process.env.TIME_ZONE).abbr(Date.now())}`) ?? new Date(),
    map: options.map.split('_')[1],
    maxTeamCount: options.playercount,
    mode: options.gamemode.split('_')[1],
    players: {
      a: [],
      b: []
    },
    status: 'created',
    timestamp: new Date(),
    spectators: options.spectators ? [] : false,
    rankMinimum: options.rankminimum ?? 0,
    rankMaximum: options.rankmaximum ?? 99
  }

  const embed = new GLOBALS.Embed()
    .setTitle('Match Creation Complete')
    .setDescription('Your match has been made! To start it, type `v!match start <match id>`')
    .setFooter('This message will self-destruct in 30 seconds.')
    .toJSON()

  GLOBALS.client.api.interactions(interaction.id, interaction.token).callback.post({
    data: {
      type: 4,
      data: {
        embeds: [embed],
        flags: 64
      }
    }
  })

  let guildInformation = await GLOBALS.db.collection('guilds').doc(interaction.guild_id).get()
  if (!guildInformation.exists) guildInformation.notificationRole = interaction.guild_id
  else guildInformation = guildInformation.data()

  const matchEmbed = new GLOBALS.Embed()
    .setTitle('Match Information')
    .setDescription('React with 🇦 to join the A team, react with 🇧 to join the B team' + (matchInformation.spectators instanceof Array ? ', and react with 🇸 to be a spectator.' : '.'))
    .setThumbnail(CONSTANTS.MAPS_THUMBNAILS[matchInformation.map])
    .setTimestamp(matchInformation.date)
    .setAuthor(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png`)
    .addField('Status', CONSTANTS.capitalizeFirstLetter(matchInformation.status), true)
    .addField('Game Mode', CONSTANTS.capitalizeFirstLetter(matchInformation.mode), true)
    .addField('Map', CONSTANTS.capitalizeFirstLetter(matchInformation.map), true)
    .addField('Max Team Count', matchInformation.maxTeamCount + ' players per team', true)
    .addField('Minimum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchInformation.rankMinimum]), true)
    .addField('Maximum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchInformation.rankMaximum]), true)
    .addField('Team A', 'None', true)
    .addField('Team B', 'None', true)
    .addField('Spectators', matchInformation.spectators instanceof Array ? 'None' : 'Not allowed', true)
  const messageChannel = await GLOBALS.client.channels.fetch(interaction.channel_id)
  messageChannel.send(`A match has been created! <@&${guildInformation.notificationRole}>`, matchEmbed)
    .then(async message => {
      message.react('🇦')
      message.react('🇧')
      if (matchInformation.spectators) message.react('🇸')
      matchEmbed.setFooter('match id: ' + message.id)
      message.edit(matchEmbed)
      matchInformation.message = {
        id: message.id,
        channel: message.channel.id
      }
      await GLOBALS.db.collection('matches').doc(message.id).set(matchInformation)
      GLOBALS.db.collection('guilds').doc(message.guild.id).collection('matches').doc(message.id).set({ data: GLOBALS.db.collection('matches').doc(message.id) })
    })
}
