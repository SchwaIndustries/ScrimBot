module.exports = exports = {
  name: 'restart',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    if (await GLOBALS.userIsAdmin(message.author.id) === false) return message.reply('This command can only be executed by bot admins.')
    const embed = new GLOBALS.Embed()
      .setTitle('Restarting!')
      .setDescription('See you soon!')
    await message.channel.send(embed)
    GLOBALS.client.destroy()
    process.exit(0)
  }
}
