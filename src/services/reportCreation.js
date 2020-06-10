const Discord = require('discord.js')

module.exports = exports = {
  name: 'reportCreation',
  enabled: true,
  process: async (GLOBALS) => {
    GLOBALS.client.on('message', async message => {
      if (message.author === GLOBALS.client.user || message.author.bot === true) return // ignore messages from the bot itself or other bots
      if (GLOBALS.activeReportCreation.has(message.author.id)) {
        handlePlayerReport(activeReportCreation.get(message.author.id), message, GLOBALS)
        return
      }
    })
    GLOBALS.client.on('messageReactionAdd', (reaction, user) => {
      if (user.bot) return // ignore messages from the bot itself or other bots
    
      if (GLOBALS.activeReportCreation.has(user.id)) cancelReportCreation(reaction, user, GLOBALS)
    })
  }
}


const reportWebhook = new Discord.WebhookClient('719586184229159013', 'x_8m24WRM7b6aK19WIoF5cf61BcgwcUjtzaQz_qNLxnMPcLUdouFW4OZEANcT9I_xbUU')

const handlePlayerReport = async (reportRecord, userMessage) => {
  if (userMessage.channel.type !== 'dm') return

  switch (reportRecord.step) {
    case 0: {
      const existingRecord = await GLOBALS.db.collection('guilds').doc(userMessage.content).get()
      if (!existingRecord.exists) return userMessage.reply('The ID provided is not valid. Please make sure to provide a valid ID').then(msg => msg.delete({ timeout: 10000 }))
      reportRecord.reportInformation.GuildID = userMessage.content
      break
    }
    case 1: {
      const existingRecord = await GLOBALS.db.collection('users').doc(userMessage.content).get()
      if (!existingRecord.exists) return userMessage.reply('The ID provided is not valid. Please make sure to provide a valid ID').then(msg => msg.delete({ timeout: 10000 }))
      reportRecord.reportInformation.offenderDiscordID = userMessage.content
      break
    }
    case 2: {
      const dateString = userMessage.content.split(' ')
      if (dateString.length === 2) {
        const actualDate = moment().tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('YYYY-MM-DD')
        dateString.push(actualDate)
      }
      break
    }
    case 3: {
      reportRecord.reportInformation.reason = userMessage.content
      break
    }
  }

  if (reportRecord.step < reportCreationSteps.length - 1) {
    const embed = reportRecord.botMessage.embeds[0]

    const previousField = embed.fields[reportRecord.step]
    previousField.name = '✅ ' + previousField.name

    reportRecord.step = reportRecord.step + 1

    const stepInfo = reportCreationSteps[reportRecord.step]
    embed.addField(stepInfo[0], stepInfo[1])
    reportRecord.botMessage.edit(embed)

    activeReportCreation.set(reportRecord.userID, reportRecord)
  } else {
    const embed = new GLOBALS.embed()
      .setTitle('ScrimBot Report Complete')
      .setDescription('Thanks for reporting and keeping the community safe!')
    reportRecord.botMessage.edit(embed)
    reportRecord.botReaction.users.remove(client.user)
    reportRecord.reportInformation.timestamp = new Date()
    GLOBALS.db.collection('users').doc(reportRecord.reportInformation.offenderDiscordID).collection('reports').add(reportRecord.reportInformation)
    const reportEmbed = new GLOBALS.embed()
      .setTitle('User Report')
      .addField('Guild', `${client.guilds.resolve(reportRecord.reportInformation.GuildID)}, ${reportRecord.reportInformation.GuildID}`)
      .addField('Report for', `<@${reportRecord.reportInformation.offenderDiscordID}>`)
      .addField('Reported by', `<@${reportRecord.reportInformation.reporterDiscordID}>`)
      .addField('Reported for', reportRecord.reportInformation.reason)
    reportWebhook.send(reportEmbed)
    activeReportCreation.delete(reportRecord.userID)
  }
}

const cancelReportCreation = async (reaction, user) => {
  if (reaction.emoji.name === '❌') {
    const userRecord = activeReportCreation.get(user.id)
    const embed = new GLOBALS.embed()
      .setTitle('ScrimBot Report Cancelled')
      .setDescription('Your report has been cancelled. If you want to try again, just type v!report.')
    userRecord.botMessage.edit(embed)
    activeReportCreation.delete(userRecord.userID)
    reaction.remove()
  }
}