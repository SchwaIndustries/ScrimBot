'use strict'
// @ts-check
/* eslint-disable no-multiple-empty-lines */

// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Imports and global variables

/* eslint-disable indent */
const Discord = require('discord.js')
  const client = new Discord.Client()
  client.commands = new Map()
  client.services = new Map()
require('dotenv').config()
const admin = require('firebase-admin')
  admin.initializeApp()
  const db = admin.firestore()
const Express = require('express')
  const app = Express()
const fs = require('fs')

const CONSTANTS = require('./constants')

class ScrimBotEmbed extends Discord.MessageEmbed {
  constructor (specialColor) {
    super()
    this.setColor(specialColor || 'PURPLE')
    this.footer = { text: 'Sponsored by Limitless Gaming', iconURL: 'https://cdn.discordapp.com/icons/667553378607431681/0129a1e3f29b541b6af45c8c3fb0dd14.webp' }
  }

  setFooter (text, override) {
    if (override) {
      this.footer.text = text
    }
    this.footer.text += `\n${text}`
    return this
  }
}

const GLOBALS = {
  'client': client,
  'embed': ScrimBotEmbed,
  'db': db,
  'app': app,
  'activeUserRegistration': new Discord.Collection(),
  'activeMatchCreation': new Discord.Collection(),
  'activeReportCreation': new Discord.Collection()
}

/* eslint-enable indent */

// module.exports = exports = {
//   name: '',
//   usage: '',
//   enabled: true,
//   process: async (message, GLOBALS) => {
    
//   }
// }

// module.exports = exports = {
//   name: '',
//   enabled: true,
//   process: async (GLOBALS) => {
    
//   }
// }

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}! All systems online.`)
  client.user.setActivity('for matches | v!help', { type: 'WATCHING' })
  runServices()
  loadCommands()
})

client.on('message', async message => {
  if (message.author === client.user || message.author.bot === true) return // ignore messages from the bot itself or other bots

  const commandName = message.content.split(' ')[0].substring(2).toLowerCase()
  if (client.commands.has(commandName)) {
    const commandData = client.commands.get(commandName)
    try {
      commandData.process(message, GLOBALS)
    } catch (e) {
      console.error(`Error with v!${commandName}. Looks like we got a ${e}`)
    }
  }
})


function loadCommands () {
  for (const file of fs.readdirSync('./src/commands/')) {
    if (!file.endsWith('.js')) return
    const command = require(`./commands/${file}`)
    if (command.enabled === true) client.commands.set(command.name, command)
  }
}

function runServices () {
  for (const file of fs.readdirSync('./src/services/')) {
    const service = require(`./services/${file}`)
    if (service.enabled === true) client.services.set(service.name, service)
  }
  client.services.forEach(service => service.process(GLOBALS))
}

if (process.env.TOKEN) {
  client.login(process.env.TOKEN)
} else {
  console.error('Bot token not found! Ensure environment variable TOKEN contains the bot token. If you don\'t understand this, go read the documentation.')
}

process.on('unhandledRejection', console.error)
