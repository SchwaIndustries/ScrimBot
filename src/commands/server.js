const CONSTANTS = require('../constants.js')

const checkRoleValidity = role => {
  if (role.startsWith('<@&')) {
    role = role.replace(/<@&/, '').replace(/>$/, '')
  }

  if (!isNaN(role)) return role
  else return false
}

module.exports = exports = {
  name: 'server', // command name
  usage: '<add/info/edit>', // arguments for the command
  enabled: true, // whether the command should be loaded
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    if (!message.guild) return message.reply('This command can only be run in a server!')
    switch (message.content.split(' ')[1]) {
      case 'add': add(message, GLOBALS); break
      case 'info': info(message, GLOBALS); break
      case 'edit': edit(message, GLOBALS); break
    }
  }
}

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const add = async (message, GLOBALS) => {
  const guildInformation = await GLOBALS.mongoDb.collection('guilds').findOne({ _id: message.guild.id })
  if (guildInformation) return message.reply('This server is already configured!')

  const embed = new GLOBALS.Embed()
  embed.setTitle('ScrimBot Initialization')
  embed.setDescription('Thanks for choosing ScrimBot! This setup procedure will only take 30 seconds.')
  embed.addField('1. Match Notification Role', 'ScrimBot has the feature to mention a role when new matches are created. Please either respond with the role ID of that role or mention it.')
  const reply = await message.reply(embed)

  // Match Notifications
  let matchNotifications = await message.channel.awaitMessages(m => m.author === message.author, { max: 1, time: 60000, errors: ['time'] }).catch(e => message.reply('Time has run out. To setup your server, please run `v!server add` again.'))
  matchNotifications = checkRoleValidity(matchNotifications.first().content)
  if (!matchNotifications) return message.reply('That is not a valid role! Please run `v!server add` again.')

  // Valorant Rank Roles
  embed.fields[0].name = '✅ 1. Match Notification Role'
  embed.addField('2. Valorant Rank Roles', 'ScrimBot has the feature to create and give users a role based on their ranks. Would you like this? (yes or no)')
  reply.edit(embed)

  let valorantRankRoles = await message.channel.awaitMessages(m => m.author === message.author, { max: 1, time: 60000, errors: ['time'] }).catch(e => message.reply('Time has run out. To setup your server, please run `v!server add` again.'))
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

  await GLOBALS.mongoDb.collection('guilds').insertOne({
    _id: message.guild.id,
    name: message.guild.name,
    notificationRole: matchNotifications,
    valorantRankRoles: rankRoleIDs || false
  })
}

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const info = async (message, GLOBALS) => {
  const guildInformation = await GLOBALS.mongoDb.collection('guilds').findOne({ _id: message.guild.id })
  if (!guildInformation) return message.reply('This server has not been configured yet. Please run v!server add')
}

/**
 * @param {import('discord.js').Message} message
 * @param {import('../index.js').GLOBALS} GLOBALS
 */
const edit = async (message, GLOBALS) => {
  const guildInformation = await GLOBALS.mongoDb.collection('guilds').findOne({ _id: message.guild.id })
  if (!guildInformation) return message.reply('This server has not been configured yet. Please run v!server add')
}
