
const checkRoleValidity = role => {
  if (role.startsWith('<&')) {
    role = role.replace(/<&/, '').replace(/>$/, '')
  }

  if (!isNaN(role)) return role
  else return false
}

module.exports = exports = {
  name: 'guild', // command name
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

    let matchNotifications = await message.channel.awaitMessages(m => m.author === message.author, { max: 1, time: 60000, errors: ['time'] }).catch(e => message.reply('Time has run out. To setup your server, please run `v!guild add` again.'))
    console.log(matchNotifications)
    matchNotifications = checkRoleValidity(matchNotifications.first().content)
    if (!matchNotifications) return message.reply('That is not a valid role! Please run `v!guild add` again.')

    embed.addField('2. Banned User Role', 'ScrimBot has the feature to give users a role when they are banned. Please either respond with the role ID of that role or mention it.')
    reply.edit(embed)
    let banRole = await message.channel.awaitMessages(m => m.author === message.author, { max: 1, time: 60000, errors: ['time'] }).catch(e => message.reply('Time has run out. To setup your server, please run `v!guild add` again.'))
    banRole = checkRoleValidity(banRole.first().content)
    if (!banRole) return message.reply('That is not a valid role! Please run `v!guild add` again.')

    const completionEmbed = new GLOBALS.Embed()
    completionEmbed.setTitle('ScrimBot Initialization Complete')
    completionEmbed.setDescription('Your setup is complete, thanks for bearing with us! Don\'t forget to put the "Scrimbot" role above the Match Notification and Banned role for role management to work properly. Run `v!match create` to start your first match.')
    reply.edit(completionEmbed)

    guildInformationRef.set({
      name: message.guild.name,
      notificationRole: matchNotifications,
      banRole: banRole
    })
  }
}
