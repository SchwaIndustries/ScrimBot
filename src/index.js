'use strict'

/* eslint-disable indent */
const Discord = require('discord.js')
  const client = new Discord.Client()
require('dotenv').config()
const admin = require('firebase-admin')
  const serviceAccount = require('../' + process.env.FIR_SERVICEACCOUNT)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://fun-valorant-times.firebaseio.com'
  })
  const db = admin.firestore()
const Express = require('express')
  const app = Express()
const https = require('https')
/* eslint-enable indent */

// \\
// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// Heroku Init \\

app.set('port', (process.env.PORT || 2500))

app.get('/', function (request, response) {
  response.send(`
    Hey.
  `)
}).listen(app.get('port'), function () {
  console.log(`Hey Norman, we got uptime! Actively porting on ${app.get('port')}`)
})

setInterval(() => {
  https.get('https://valorant-scrim-bot.herokuapp.com')
}, 5 * 60 * 1000) // 5 minutes in milliseconds

const activeUserRegistration = new Discord.Collection()
const userRegistrationSteps = [
  ['1. Valorant Username', 'What is your FULL Valorant username?'],
  ['2. Valorant Rank', 'What rank are you in Valorant? If you don\'t have a rank, type "N/A"'],
  ['3. Notifications', 'Do you want to be notified when LFG starts? Respond "yes" if you would like to opt-in.']
]

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}! All systems online.`)
  client.user.setActivity('for matches', { type: 'WATCHING' })
})

client.on('message', async message => {
  if (message.author === client.user || message.author.bot === true) return // ignore messages from the bot itself or other bots
  if (activeUserRegistration.has(message.author.id)) {
    handleUserRegistration(activeUserRegistration.get(message.author.id), message)
    return
  }
  if (message.guild.id !== '704495983542796338' && message.guild.id !== '350855731609600000') return // ignore message if not from "Fun Valorant Times"

  /* eslint-disable brace-style */
  if (message.content === 'v!register') {
    const existingRecord = await db.collection('users').doc(message.author.id).get()
      .catch(console.error)
    if (existingRecord.exists) {
      message.reply('You have already registered!')
      return
    }

    const embed = new RegistrationEmbed({
      name: message.author.tag,
      iconURL: message.author.avatarURL()
    })
    embed.addField('1. Valorant Username', 'What is your FULL Valorant username?')
    message.reply('Welcome to ScrimBot!', embed)
      .then(async registrationMessage => {
        activeUserRegistration.set(message.author.id, {
          step: 0,
          botMessage: registrationMessage,
          userID: message.author.id,
          registrationInformation: {
            discordID: message.author.id
          }
        }) // add user to the list of users who are currently registering, and set their progress to 0 (none)
        await registrationMessage.react('❌')
      })
  }

  else if (message.content === 'v!match create') {
    const embed = new Discord.MessageEmbed()
      .setTitle('Create a Match')
      .setDescription('Let\'s start a match!')
    message.reply(embed)
  }

  else if (message.content === 'v!match join') {
    const embed = new Discord.MessageEmbed()
      .setTitle('Join a Match')
      .setDescription('React with the match you want to join!')
    message.reply(embed)
  }

  else if (message.content === 'v!help') {
    const embed = new Discord.MessageEmbed()
      .setTitle('Help')
      .setDescription('v!register: Register to join matches.\nv!match create: Start a match.\nv!match join: Join a match.')
    message.channel.send(embed)
  }

  else if (message.content === 'v!ping') {
    const embed = new Discord.MessageEmbed()
      .setTitle('You have pinged me')
      .setDescription('Who\'s down for a game of ping pong? ')
      .setURL('https://pong-2.com/')
    message.reply(embed)
  }
  /* eslint-enable brace-style */
})

client.on('messageReactionAdd', (reaction, user) => {
  if (activeUserRegistration.has(user.id) === false) return
  if (reaction.emoji.name === '❌') {
    const userRecord = activeUserRegistration.get(user.id)
    const embed = new Discord.MessageEmbed()
      .setTitle('ScrimBot Registration Cancelled')
      .setDescription('Your registration has been cancelled. If you want to try again, just type !register.')
    userRecord.botMessage.edit(embed)
    activeUserRegistration.delete(userRecord.userID)
    reaction.remove()
  }
})

if (process.env.TOKEN) {
  client.login(process.env.TOKEN)
} else {
  console.error('Bot token not found! Ensure environment variable TOKEN contains the bot token.')
}

class RegistrationEmbed {
  constructor (author) {
    const embed = new Discord.MessageEmbed()
      .setTitle('ScrimBot Registration')
      .setAuthor(author.name, author.iconURL)
      .setDescription('Welcome to ScrimBot! We will ask you a set of questions to get started. At any time, you can cancel by reacting with the x below. You can either respond to these questions in the current channel or through DMs with the bot.')
    return embed
  }
}

const handleUserRegistration = (userRecord, userMessage) => {
  if (userMessage.channel.type !== 'dm' && userMessage.channel !== userRecord.botMessage.channel) return

  switch (userRecord.step) {
    case 0:
      userRecord.registrationInformation.valorantUsername = userMessage.content
      break
    case 1:
      userRecord.registrationInformation.valorantRank = userMessage.content
      break
    case 2:
      userRecord.registrationInformation.notifications = (userMessage.content === 'yes')
      break
  }

  if (userRecord.step < userRegistrationSteps.length - 1) {
    const embed = userRecord.botMessage.embeds[0]

    const previousField = embed.fields[userRecord.step]
    previousField.name = '✅ ' + previousField.name

    userRecord.step = userRecord.step + 1

    const stepInfo = userRegistrationSteps[userRecord.step]
    embed.addField(stepInfo[0], stepInfo[1])
    userRecord.botMessage.edit(embed)

    activeUserRegistration.set(userRecord.userID, userRecord)
  } else {
    const embed = new Discord.MessageEmbed()
      .setTitle('ScrimBot Registration Complete')
      .setDescription('Thanks for registering! Now it\'s time to get playing!')
    userRecord.botMessage.edit(embed)
    userRecord.botMessage.reactions.removeAll()
    userRecord.registrationInformation.timestamp = new Date()
    db.collection('users').doc(userRecord.userID).set(userRecord.registrationInformation)
    console.log(userRecord)
    activeUserRegistration.delete(userRecord.userID)
  }
}
