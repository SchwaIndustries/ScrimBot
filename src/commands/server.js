const CONSTANTS = require('../constants.js')

const checkRoleValidity = role => {
  if (role.startsWith('<@&')) {
    role = role.replace(/<@&/, '').replace(/>$/, '')
  }

  if (!isNaN(role)) return role
  else return false
}

const checkChannelValidity = channel => {
  if (channel.startsWith('<#')) {
    channel = channel.replace(/<&/, '').replace(/>$/, '')
  }

  if (!isNaN(channel)) return channel
  else return false
}

module.exports = exports = {
  name: 'server', // command name
  usage: '<add>', // arguments for the command
  enabled: true, // whether the command should be loaded
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    if (message.content.split(' ')[1] !== 'add') return
    if (!message.guild) return message.reply('This command can only be run in a server!')

    const guildInformationRef = GLOBALS.db.collection('guilds').doc(message.guild.id)
    if ((await guildInformationRef.get()).exists === true) return message.reply('This server is already configured!')

    const embed = new GLOBALS.Embed()
    embed.setTitle('ScrimBot Initialization')
    embed.setDescription('Thanks for choosing ScrimBot! This setup procedure will only take 30 seconds.')
    const reply = await message.reply(embed)

    const promptIndex = { index: 0 } // Field index of current prompt (each prompt is its own field)

    // Match Notifications
    let matchNotifications = await promptUser(message, reply, promptIndex, embed, 'Match Notification Role', 'ScrimBot has the feature to mention a role when new matches are created. Please either respond with the role ID of that role or mention it.')
    matchNotifications = checkRoleValidity(matchNotifications.first().content)
    if (!matchNotifications) return message.reply('That is not a valid role! Please run `v!server add` again.')

    // Match Channel
    let matchChannelID = await promptUser(message, reply, promptIndex, embed, 'Scrim Match Channel', 'ScrimBot has the feature to select a channel specifically for created matches to be sent. If you would like this, please reply with the channel ID. If you do not want this, please write "no".')
    matchChannelID = checkChannelValidity(matchChannelID.first().content)
    if (matchChannelID) {
      try {
        const matchChannel = await GLOBALS.client.channels.fetch(matchChannelID)
        if (!matchChannel.permissionsFor(GLOBALS.client.user).has('SEND_MESSAGES')) throw new Error('Unable to send messages')
      } catch {
        return message.reply('ScrimBot does not have the permission to type in that channel or cannot find it. Please change the permissions and run v!server add again.')
      }
    }

    // Valorant Rank Roles
    let valorantRankRoles = await promptUser(message, reply, promptIndex, embed, 'Valorant Rank Roles', 'ScrimBot has the feature to create and give users a role based on their ranks. Would you like this?')
    valorantRankRoles = CONSTANTS.AFFIRMATIVE_WORDS.includes(valorantRankRoles.first().content.toLowerCase())

    let rankRoleIDs
    if (valorantRankRoles) {
      const guild = message.guild
      if (!guild.me.hasPermission('MANAGE_ROLES')) return message.reply('ScrimBot does not have the manage roles permission and is unable to create roles. Please change the permissions and run v!server add again.')
      const rolesToCreate = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Immortal', 'Radiant']
      rankRoleIDs = []
      for (const role of rolesToCreate.reverse()) {
        const newRole = await guild.roles.create({
          data: {
            name: role
          },
          reason: 'ScrimBot Valorant rank roles'
        }).catch(console.error)
        rankRoleIDs.push(newRole.id)
      }
      rankRoleIDs = rankRoleIDs.reverse()
    }

    const completionEmbed = new GLOBALS.Embed()
    completionEmbed.setTitle('ScrimBot Initialization Complete')
    completionEmbed.setDescription('Your setup is complete, thanks for bearing with us! Don\'t forget to put the "ScrimBot" role above Match Notifications for role management to work properly. Run `v!match create` to start your first match.')
    reply.edit(completionEmbed)

    guildInformationRef.set({
      name: message.guild.name,
      notificationRole: matchNotifications,
      valorantRankRoles: rankRoleIDs || false
    })
  }
}

async function promptUser (originalMessage, promptMessage, promptIndex, embed, title, question) {
  if (promptIndex.index > 0) embed.fields[promptIndex.index - 1].name = '✅ ' + embed.fields[promptIndex.index - 1].name
  embed.addField((promptIndex.index + 1) + '. ' + title, question)
  await promptMessage.edit(embed)
  promptIndex.index++
  return originalMessage.channel.awaitMessages(m => m.author === originalMessage.author, { max: 1, time: 60000, errors: ['time'] }).catch(() => originalMessage.reply('Time has run out. To setup your server, please run `v!server add` again.'))
}
