module.exports = exports = {
    name: 'report',
    usage: '',
    enabled: true,
    process: async (message, GLOBALS) => {
        const embed = new GLOBALS.embed()
        .setTitle('ScrimBot Report System')
        .setAuthor(message.author.tag, message.author.avatarURL())
        .setDescription('Welcome to ScrimBot Report System! We will ask you a set of questions to get started. At any time, you can cancel by reacting with the x below.')
        .addField(reportCreationSteps[0][0], reportCreationSteps[0][1])
      await message.author.createDM()
      message.author.send(embed)
        .then(async reportMessage => {
          const botReaction = await reportMessage.react('❌')
          activeReportCreation.set(message.author.id, {
            step: 0,
            botMessage: reportMessage,
            botReaction: botReaction,
            userID: message.author.id,
            reportInformation: {
              reporterDiscordID: message.author.id,
              offenderDiscordID: '',
              reason: '',
              timestamp: undefined
            }
          }) // add user to the list of users who are currently registering, and set their progress to 0 (none)
          if (message.guild) message.reply('Check your DMs!')
        })
    }
  }

