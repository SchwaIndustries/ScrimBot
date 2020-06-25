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
  usage: '<add>', // arguments for the command
  enabled: true, // whether the command should be loaded
  process: async (message, GLOBALS) => {
    if (message.content.split(' ')[1] !== 'add') return
    if (!message.guild) return message.reply('This command can only be run in a server!')

    const guildInformationRef = GLOBALS.db.collection('guilds').doc(message.guild.id)
    if ((await guildInformationRef.get()).exists === true) return message.reply('This server is already configured!')

    const embed = new GLOBALS.Embed()
    embed.setTitle('ScrimBot Initialization')
    embed.setDescription('Thanks for choosing ScrimBot! This setup procedure will only take 30 seconds.')
    embed.addField('1. Match Notification Role', 'ScrimBot has the feature to mention a role when new matches are created. Please either respond with the role ID of that role or mention it.')
    const reply = await message.reply(embed)

    // Match Notifications
    let matchNotifications = await message.channel.awaitMessages(m => m.author === message.author, { max: 1, time: 60000, errors: ['time'] }).catch(e => message.reply('Time has run out. To setup your server, please run `v!server add` again.'))
    matchNotifications = checkRoleValidity(matchNotifications.first().content)
    if (!matchNotifications) return message.reply('That is not a valid role! Please run `v!server add` again.')

    // Banned User Role
    embed.fields[0].name = '✅ 1. Match Notification Role'
    embed.addField('2. Banned User Role', 'ScrimBot has the feature to give users a role when they are banned. Please either respond with the role ID of that role or mention it.')
    reply.edit(embed)

    let banRole = await message.channel.awaitMessages(m => m.author === message.author, { max: 1, time: 60000, errors: ['time'] }).catch(e => message.reply('Time has run out. To setup your server, please run `v!server add` again.'))
    banRole = checkRoleValidity(banRole.first().content)
    if (!banRole) return message.reply('That is not a valid role! Please run `v!server add` again.')

    // Valorant Rank Roles
    embed.fields[1].name = '✅ 2. Banned User Role'
    embed.addField('3. Valorant Rank Roles', 'ScrimBot has the feature to create and give users a role based on their ranks. Would you like this? (yes or no)')
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
    completionEmbed.setDescription('Your setup is complete, thanks for bearing with us! Don\'t forget to put the "Scrimbot" role above the Match Notification and Banned role for role management to work properly. Run `v!match create` to start your first match.')
    reply.edit(completionEmbed)

    guildInformationRef.set({
      name: message.guild.name,
      notificationRole: matchNotifications,
      banRole: banRole,
      valorantRankRoles: rankRoleIDs || false
    })
  }
}
