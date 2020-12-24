module.exports = exports = {
  name: 'support', // command name
  usage: '', // arguments for the command
  enabled: true, // whether the command should be loaded
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Support Server')
      .setDescription('For support, please join [Valorant Collective](https://discord.gg/hfFJxUG), and head to the Scrimbot Support Channel!')
      .setURL('https://discord.gg/hfFJxUG')
    message.channel.send(embed)
  }

}
