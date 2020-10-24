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

const CONSTANTS = require('./constants')
const fs = require('fs')
const path = require('path')
const Discord = require('discord.js')
  const client = new Discord.Client({
    presence: {
      activity: { name: 'for matches | v!help', type: 'WATCHING' }
    }
  })
require('dotenv').config()
verifyConfigurationIntegrity()
const admin = require('firebase-admin')
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) admin.initializeApp()
  else {
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
  }
  const db = admin.firestore()
// ScrimBot specific properties
/**
 * @type {Map<string, object>}
 */
client.commands = new Map() // Stores all bot commands
client.services = new Map() // Stores all bot services (functions that run at start)

class ScrimBotEmbed extends Discord.MessageEmbed {
  constructor (specialColor) {
    super()
    this.setColor(specialColor || 'PURPLE')
  }
}

class MatchEmbed extends ScrimBotEmbed {
  async setMatchData (matchData) {
    const matchCreator = await client.users.fetch(matchData.creator)
    this.setTitle('Match Information')
    this.setAuthor(matchCreator.tag, matchCreator.avatarURL())
    this.setThumbnail(CONSTANTS.MAPS_THUMBNAILS[matchData.map])
    this.setTimestamp(new Date(matchData.date))
    this.addField('Status', CONSTANTS.capitalizeFirstLetter(matchData.status), true)
    this.addField('Game Mode', CONSTANTS.capitalizeFirstLetter(matchData.mode), true)
    this.addField('Map', CONSTANTS.capitalizeFirstLetter(matchData.map), true)
    this.addField('Max Team Count', matchData.maxTeamCount + ' players per team', true)
    this.addField('Minimum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchData.rankMinimum]), true)
    this.addField('Maximum Rank', CONSTANTS.capitalizeFirstLetter(CONSTANTS.RANKS_REVERSED[matchData.rankMaximum]), true)
    this.addField('Team A', 'None', true)
    this.addField('Team B', 'None', true)
    this.addField('Spectators', matchData.spectators instanceof Array ? 'None' : 'Not allowed', true)

    if (matchData.players.a.length > 0) {
      this.fields[6].value = ''
      for (const playerRef of matchData.players.a) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        this.fields[6].value += `\n• ${playerDoc.valorantUsername}`
      }
    }
    if (matchData.players.b.length > 0) {
      this.fields[7].value = ''
      for (const playerRef of matchData.players.b) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        this.fields[7].value += `\n• ${playerDoc.valorantUsername}`
      }
    }
    if (matchData.spectators instanceof Array && matchData.spectators.length > 0) {
      this.fields[8].value = ''
      for (const playerRef of matchData.spectators) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        this.fields[8].value += `\n• ${playerDoc.valorantUsername}`
      }
    }

    if (matchData.status === 'completed') {
      this.addField('Final Score', `${matchData.score[0]}-${matchData.score[1]}`)
    } else {
      this.setDescription('React with 🇦 to join the A team, react with 🇧 to join the B team' + (matchData.spectators instanceof Array ? ', and react with 🇸 to be a spectator.' : '.'))
    }
  }

  constructor (matchData, specialColor) {
    super(specialColor)
    this.setMatchData(matchData)
  }
}

/**
 * @typedef {Object} GLOBALS
 * @property {Discord.Client} client
 * @property {ScrimBotEmbed} Embed
 * @property {MatchEmbed} MatchEmbed
 * @property {admin.firestore.Firestore} db
 * @property {Discord.Collection} activeUserRegistration
 * @property {function} userIsAdmin
 * @property {function} userIsRegistered
 */

// Global variables accessible from all files
const GLOBALS = {
  client,
  Embed: ScrimBotEmbed,
  MatchEmbed: MatchEmbed,
  db,
  activeUserRegistration: new Discord.Collection(),
  activeMatchCreation: new Discord.Collection(),
  /**
   * Checks whether a specified user is a bot admin
   * @param {String} userId User ID to check
   */
  userIsAdmin: async userId => {
    const userData = await db.collection('users').doc(userId).get()
    if (!userData.exists) return false
    return userData.get('admin') === true
  },
  /**
   * Checks whether a specified user is registered with the bot
   * @param {String} userId User ID to check
   */
  userIsRegistered: async userId => {
    const userData = await db.collection('users').doc(userId).get()
    if (!userData.exists) return false
    else return userData
  }
}

/* eslint-enable indent */

// /////////////////////////////////////////////////////////////////////////// //
// MARK: - Ready listener

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}! All systems online.`)
  runServices()
  loadCommands()
})

/**
 * Reads the command files from `src/commands` and
 * adds them to the `client.commands` collection which
 * allows the bot to use them
 */
function loadCommands () {
  for (const file of fs.readdirSync(path.join(__dirname, 'commands'))) { // get all files in commands folder
    if (!file.endsWith('.js')) return // only look for .js files
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
  }
}

/**
 * Reads the service files from `src/services` and
 * adds them to the `client.services` collection.
 * The bot then runs all of the services at startup.
 * This is useful for certain things that need to be run
 * independently of commands.
 */
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

  const commandName = message.content.split(' ')[0].substring(process.env.PREFIX.length).toLowerCase() // extract command name from the message by removing the prefix
  if (message.content.toLowerCase().startsWith(process.env.PREFIX) && client.commands.has(commandName)) {
    const commandData = client.commands.get(commandName)
    if (!commandData.enabled) return
    try {
      commandData.process(message, GLOBALS) // attempt to run command
    } catch (e) {
      console.error(`Error with ${process.env.PREFIX}${commandName}. Looks like we got a ${e}`)
    }
  }
})

// /////////////////////////////////////////////////////////////////////////// //
// MARK: - Login bot

client.login(process.env.TOKEN)

// /////////////////////////////////////////////////////////////////////////// //
// MARK: - Error handling

/**
 * Make sure that environment variables
 * contain all the neccessary information.
 */
function verifyConfigurationIntegrity () {
  if (!process.env.TOKEN) throw new Error('Discord bot token not found! Ensure environment variable TOKEN contains the bot token. View README.md for more information')
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const firebaseConfigs = ['FIR_PROJID', 'FIR_CLIENTID', 'FIR_PRIVATEKEY_ID', 'FIR_PRIVATEKEY']
    firebaseConfigs.forEach(config => {
      if (!process.env[config]) throw new Error('Firebase config ' + config + ' not found! View README.md for more information.')
    })
  }
  if (!process.env.TIME_ZONE) process.env.TIME_ZONE = 'America/Los_Angeles'
  if (!process.env.PREFIX) process.env.PREFIX = 'v!'
}

if (process.env.NODE_ENV === 'development') client.on('debug', console.info)
client.on('error', console.error)
client.on('shardError', console.error)
client.on('warn', console.warn)

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
process.on('warning', console.warn)
