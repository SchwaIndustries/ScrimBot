module.exports = exports = {
  name: 'help',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Help')
      .setDescription(`v!help: Show this help menu.
      v!ping: Play a game of ping pong.
      v!register: Register to join matches.
      v!invite: Invite the bot to your server!
      v!match create: Create a match.
      v!match join: Join a match.
      v!match start <match id>: Start a match (only for match creator)
      v!match cancel <match id>: Cancel a match (must be match creator)
      v!match score <match id> <team a score>-<team b score>: Report final match score (only for match creator)
      v!match edit <match id> <property to edit> <edited value>: Edit match information (only for match creator)
      v!match info <match id>: Retrieves match information
      v!user info <mention or user id>: Retrieves user information
      v!user edit <username, rank, notifications> <edited value>: Edit user info
      
      *Special thanks to Limitless Gaming:* https://discord.gg/kKPSCaB`)
    embed.setFooter('', true)
    message.channel.send(embed)
  }
}
