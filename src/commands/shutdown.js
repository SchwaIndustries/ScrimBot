module.exports = exports = {
    name: 'shutdown',
    usage: '',
    enabled: true,
    process: async (message, GLOBALS) => {
        const existingRecord = await GLOBALS.db.collection('botAdmins').doc(message.author.id).get()
        .catch(console.error)
      if (!existingRecord.exists) return message.reply('This command can only be executed by bot admins.')
      const embed = new GLOBALS.embed()
        .setTitle('Shutdown!')
        .setDescription('Adios!')
      await message.channel.send(embed)
      GLOBALS.client.destroy()
      process.exit(0)
  }
}
