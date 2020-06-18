const childProcess = require('child_process')

module.exports = exports = {
  name: 'shutdown',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const existingRecord = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()
      .catch(console.error)
    if (!existingRecord.exists) return message.reply('This command can only be executed by bot admins.')
    const embed = new GLOBALS.Embed()
      .setTitle('Shutdown!')
      .setDescription('Adios!')
    await message.channel.send(embed)
    childProcess.exec('heroku ps:scale web=0 --app valorant-scrim-bot', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      console.error(stderr)
    })
    process.exit()
  }
}
