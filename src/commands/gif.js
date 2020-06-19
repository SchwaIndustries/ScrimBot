const giphy = require('giphy-api')(process.env.GIPHY_API)

module.exports = exports = {
  name: 'gif', // command name
  usage: '', // arguments for the command
  enabled: false, // whether the command should be loaded
  process: async (message, GLOBALS) => {
    const gif = await giphy.trending({ rating: 'r', limit: 5 })
    gif.data.forEach(gif => {
      message.channel.send(gif.url)
    })
  }
}
