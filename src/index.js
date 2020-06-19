'use strict'

// Copyright (c) 2020 ScrimBot Dev Team

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// file: index.js
// purpose: Starting point for ScrimBot

// /////////////////////////////////////////////////////////////////////////// //
/* eslint-disable indent */
// MARK: - Imports and global variables

const fs = require('fs')
const path = require('path')
const Discord = require('discord.js')
  const client = new Discord.Client()
require('dotenv').config()
const admin = require('firebase-admin')
  const firebaseCredential = {
    type: 'service_account',
    project_id: process.env.FIR_PROJID,
    private_key_id: process.env.FIR_PRIVATEKEY_ID,
    private_key: process.env.FIR_PRIVATEKEY.replace(/\\n/g, '\n'), // encoding fix: https://stackoverflow.com/a/41044630
    client_email: `firebase-adminsdk-time3@${process.env.FIR_PROJID}.iam.gserviceaccount.com`,
    client_id: process.env.FIR_CLIENTID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-time3%40${process.env.FIR_PROJID}.iam.gserviceaccount.com`
  }
  admin.initializeApp({
    credential: admin.credential.cert(firebaseCredential),
    databaseURL: `https://${process.env.FIR_PROJID}.firebaseio.com`
  })
  const db = admin.firestore()
// ScrimBot specific properties
client.commands = new Map() // Stores all bot commands
client.services = new Map() // Stores all bot services (functions that run at start)
// Custom embed that contains the sponsorship for the bot
class ScrimBotEmbed extends Discord.MessageEmbed {
  constructor (specialColor) {
    super()
    this.setColor(specialColor || 'PURPLE')
    // this.footer = { text: 'Sponsored by Limitless Gaming', iconURL: 'https://cdn.discordapp.com/icons/667553378607431681/0129a1e3f29b541b6af45c8c3fb0dd14.webp' }
  }

  // setFooter (text, override) {
  //   if (override) {
  //     this.footer.text = text
  //   }
  //   this.footer.text += `\n${text}`
  //   return this
  // }
}

// Global variables accessible from all files
const GLOBALS = {
  client: client,
  Embed: ScrimBotEmbed,
  db: db,
  activeUserRegistration: new Discord.Collection(),
  activeMatchCreation: new Discord.Collection(),
  activeReportCreation: new Discord.Collection()
}

/* eslint-enable indent */

// /////////////////////////////////////////////////////////////////////////// //
// MARK: - Ready listener

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}! All systems online.`)
  client.user.setActivity('for matches | v!help', { type: 'WATCHING' })
  runServices()
  loadCommands()
})

function loadCommands () {
  for (const file of fs.readdirSync(path.join(__dirname, 'commands'))) { // get all files in commands folder
    if (!file.endsWith('.js')) return // only look for .js files
    const command = require(`./commands/${file}`)
    if (command.enabled === true) client.commands.set(command.name, command)
  }
}

function runServices () {
  for (const file of fs.readdirSync(path.join(__dirname, 'services'))) {
    if (!file.endsWith('.js')) return // only look for .js files
    const service = require(`./services/${file}`)
    if (service.enabled === true) client.services.set(service.name, service)
  }
  client.services.forEach(service => service.process(GLOBALS))
}

// /////////////////////////////////////////////////////////////////////////// //
// MARK: - Message listener

client.on('message', async message => {
  if (message.author === client.user || message.author.bot) return // ignore messages from the bot itself or other bots

  const commandName = message.content.split(' ')[0].substring(2).toLowerCase() // extract command name from the message by removing the prefix
  if (message.content.startsWith('v!') && client.commands.has(commandName)) {
    const commandData = client.commands.get(commandName)
    try {
      commandData.process(message, GLOBALS) // attempt to run command
    } catch (e) {
      console.error(`Error with v!${commandName}. Looks like we got a ${e}`)
    }
  }
})

// /////////////////////////////////////////////////////////////////////////// //
// MARK: - Login bot

if (process.env.TOKEN) {
  client.login(process.env.TOKEN)
} else {
  console.error('Bot token not found! Ensure environment variable TOKEN contains the bot token. If you don\'t understand this, go read the documentation.')
}

// /////////////////////////////////////////////////////////////////////////// //
// MARK: - Error handling

client.on('error', console.error)
client.on('shardError', console.error)
client.on('warn', console.error)

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
process.on('warning', console.error)
