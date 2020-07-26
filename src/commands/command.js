module.exports = exports = {
  name: 'command', // command name
  usage: '<enable/disable> <command name>', // arguments for the command
  enabled: true, // whether the command should be loaded
  process: async (message, GLOBALS) => {
    const existingRecord = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()
      .catch(console.error)
    if (!existingRecord.exists) return message.reply('This command can only be executed by bot admins.')
    switch (message.content.split(' ')[1]) {
      case 'enable': enable(message, GLOBALS); break
      case 'disable': disable(message, GLOBALS); break
    }
  }
}

const enable = async (message, GLOBALS) => {
  const commandName = message.content.split(' ')[2]
  const command = GLOBALS.client.commands.get(commandName)
  if (!command) return message.reply(`Command ${commandName} not found!`)
  command.enabled = true
  GLOBALS.client.commands.set(commandName, command)
  message.reply(`Command ${commandName} successfully enabled!`)
}

const disable = async (message, GLOBALS) => {
  const commandName = message.content.split(' ')[2]
  const command = GLOBALS.client.commands.get(commandName)
  if (!command) return message.reply(`Command ${commandName} not found!`)
  command.enabled = false
  GLOBALS.client.commands.set(commandName, command)
  message.reply(`Command ${commandName} successfully disabled!`)
}
