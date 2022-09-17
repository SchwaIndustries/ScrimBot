module.exports = exports = {
  name: 'help',
  usage: '',
  enabled: true,
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Help')
      .setDescription(`
      **__MATCH COMMANDS__**
      ${process.env.PREFIX}match create: Create a match.
      ${process.env.PREFIX}match start <match id>: Start a match (only for match creator)
      ${process.env.PREFIX}match cancel <match id>: Cancel a match (must be match creator)
      ${process.env.PREFIX}match score <match id> <team a score>-<team b score>: Report final match score (only for match creator)
      ${process.env.PREFIX}match edit <match id> <date, map, minRank, maxRank, teamPlayerCount, spectators, mode> <edited value>: Edit match information (only for match creator)
      ${process.env.PREFIX}match info <match id>: Retrieves match information
      ${process.env.PREFIX}match refresh <match id>: Refreshes a broken match embed

      **__USER COMMANDS__**
      ${process.env.PREFIX}user info <mention or user id>: Retrieves user information
      ${process.env.PREFIX}user edit <username, rank, notifications> <edited value>: Edit user info

      **__MISCELLANEOUS COMMANDS__**
      ${process.env.PREFIX}help: Show this help menu.
      ${process.env.PREFIX}
      ${process.env.PREFIX}ping: Play a game of ping pong.
      ${process.env.PREFIX}register: Register to join matches.
      ${process.env.PREFIX}
    message.channel.send(embed)
  }
}
