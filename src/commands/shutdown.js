module.exports = exports = {
  name: 'shutdown',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    if (await GLOBALS.userIsAdmin(message.author.id) === false) return message.reply('This command can only be executed by bot admins.')
    const embed = new GLOBALS.Embed()
      .setTitle('Shutdown!')
      .setDescription('Adios!')
    await message.channel.send(embed)
    process.exit()
  }
}
