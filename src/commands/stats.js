module.exports = exports = {
  name: 'stats', // command name
  usage: '<discord username>', // arguments for the command
  enabled: false, // whether the command should be loaded
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    let userID = message.content.split(' ')[2]

    if (!userID) userID = message.author.id
    if (userID.startsWith('<@')) {
      userID = userID.replace(/<@!?/, '').replace(/>$/, '')
    }
    const userInformationRef = GLOBALS.db.collection('users').doc(userID)
    let userInformation = await userInformationRef.get()
    if (!userInformation.exists) return message.reply('User not found! Ensure correct user ID is submitted.')
    userInformation = userInformation.data()

    const userDiscordInformation = await GLOBALS.client.users.fetch(userID)
    const userRiotID = await userInformation.RiotID
  }
}
