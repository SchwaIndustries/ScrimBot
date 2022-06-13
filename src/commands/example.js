module.exports = exports = {
  name: 'example', // command name
  usage: '<argument>', // arguments for the command
  enabled: false, // whether the command should be loaded
  /**
   * @param {import('@kalissaac/discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    // function called when command is invoked
  }
}
