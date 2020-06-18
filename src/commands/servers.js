module.exports = exports = {
  name: 'servers',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const existingRecord = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()
    if (!existingRecord.exists) return message.reply('This command can only be executed by bot admins.')
    const embed = new GLOBALS.Embed()
      .setTitle('Uptime')
      .setDescription(`ScrimBot is currently in ${GLOBALS.client.guilds.cache.size} guilds :slight_smile:`)
      .addField('Servers', `${GLOBALS.client.guilds.cache.map(x => '\n' + x.name)}`)
    message.reply(embed)
  }
}
