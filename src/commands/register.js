const CONSTANTS = require('../constants')

module.exports = exports = {
  name: 'register',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const existingRecord = await GLOBALS.db.collection('users').doc(message.author.id).get()
      .catch(console.error)
    if (existingRecord.exists) {
      message.reply('You have already registered!')
      return
    }

    const embed = new GLOBALS.Embed()
      .setTitle('ScrimBot Registration')
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setDescription('Welcome to ScrimBot! We will ask you a set of questions to get started. At any time, you can cancel by reacting with the x below. You can either respond to these questions in the current channel or through DMs with the bot.')
      .addField(CONSTANTS.userRegistrationSteps[0][0], CONSTANTS.userRegistrationSteps[0][1])
    await message.author.createDM()
    message.author.send(embed)
      .then(async registrationMessage => {
        const botReaction = await registrationMessage.react('❌')
        GLOBALS.activeUserRegistration.set(message.author.id, {
          step: 0,
          botMessage: registrationMessage,
          botReaction: botReaction,
          userID: message.author.id,
          registrationMessage: registrationMessage,
          registrationInformation: {
            discordID: message.author.id,
            notifications: false,
            matches: [],
            timestamp: undefined,
            valorantRank: 0,
            valorantUsername: ''
          }
        }) // add user to the list of users who are currently registering, and set their progress to 0 (none)
        if (message.guild) message.reply('Check your DMs!')
      })
  }
}
