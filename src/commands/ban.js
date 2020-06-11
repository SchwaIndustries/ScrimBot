const moment = require('moment-timezone')

module.exports = exports = {
    name: 'ban',
    usage: '',
    enabled: true,
    process: async (message, GLOBALS) => {
        const attributes = message.content.split(' ')
        let banUser = attributes[1]
        if (!banUser) return message.reply('Please specify a user to ban.')
        if (banUser.startsWith('<@')) {
          banUser = banUser.replace(/<@!?/, '').replace(/>$/, '')
        }

        let banReason = attributes[2]
        if (!banReason) return message.reply('Please specify a ban reason.')
      
        let banLength = attributes[3]
        if (!banLength) return message.reply('Please specify a ban length.')
        else {
          banLength = moment().add(banLength.substring(0, banLength.length - 1), banLength.substring(banLength.length - 1))
        }
      
        const userInformationRef = GLOBALS.db.collection('users').doc(banUser)
        let userInformation = await userInformationRef.get()
        if (!userInformation.exists) return message.reply('User not found! Are they registered with ScrimBot?')
        userInformation = userInformation.data()
        if (userInformation.isBanned === true) return message.channel.send(`<@${banUser}> is already banned`)

        userInformation.banDate = new Date()
        userInformation.unbanDate = banLength.toDate()
        userInformation.isBanned = true
        userInformationRef.update(userInformation)
        const BanUser = await message.guild.members.fetch(banUser)
        BanUser.roles.add('720723322865713153')

        const embed = new GLOBALS.Embed()
        .setTitle('User Banned')
        .addField('User:', `<@${banUser}>`)
        .addField('Banned On:', userInformation.banDate)
        .addField('Ban Expiration:', userInformation.unbanDate)
        message.channel.send(embed)
  }
}