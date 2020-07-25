module.exports = exports = {
  name: 'command', // command name
  usage: '<enable / disable / debug> <command name>', // arguments for the command
  enabled: false, // whether the command should be loaded
  process: async (message, GLOBALS) => {
    const existingRecord = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()
      .catch(console.error)
    if (!existingRecord.exists) return message.reply('This command can only be executed by bot admins.')
    switch (message.content.split(' ')[1]) {
      case 'enable': enable(message, GLOBALS); break
      case 'disable': disable(message, GLOBALS); break
      case 'debug': debug(message, GLOBALS); break
    }
  }
}

const enable = async (message, GLOBALS) => {

}

const disable = async (message, GLOBALS) => {

}

const debug = async (message, GLOBALS) => {

}
