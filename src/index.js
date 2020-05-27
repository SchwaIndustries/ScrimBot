const Discord = require('discord.js')
const client = new Discord.Client()
require('dotenv').config()

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', message => {
  if (message.author === client.user) return // ignore messages from the bot itself
  if (message.guild.id !== 704495983542796338) return // ignore message if not from "Fun Valorant Times"

  if (message.content === 'ping') {
    message.reply('pong')
  }
})

if (process.env.TOKEN) {
  client.login(process.env.TOKEN)
} else {
  console.error('Bot token not found! Ensure environment variable TOKEN contains the bot token.')
}
