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
      **MATCH COMMANDS**
      v!match create: Create a match.
      v!match start <match id>: Start a match (only for match creator)
      v!match cancel <match id>: Cancel a match (must be match creator)
      v!match score <match id> <team a score>-<team b score>: Report final match score (only for match creator)
      v!match edit <match id> <date, map, minRank, maxRank, teamPlayerCount, spectators, mode> <edited value>: Edit match information (only for match creator)
      v!match info <match id>: Retrieves match information

      **USER COMMANDS**
      v!user info <mention or user id>: Retrieves user information
      v!user edit <username, rank, notifications> <edited value>: Edit user info

      **MISCELLANEOUS COMMANDS**
      v!help: Show this help menu.
      v!invite: Invite the bot to your server!
      v!ping: Play a game of ping pong.
      v!coinflip: Flip a coin.
      v!register: Register to join matches.

      **SUPPORT**
      For support, please join Valorant Collective and head to the ScrimBot Support Channel! https://discord.gg/hfFJxUG`)
    message.channel.send(embed)
  }
}
