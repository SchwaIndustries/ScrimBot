module.exports = exports = {
  name: 'version',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Version')
      .setDescription('ScrimBot is currently on v1.0.0')
<<<<<<< HEAD
    message.channel.send(embed)
=======
    message.reply(embed)
>>>>>>> master
  }
}
