module.exports = exports = {
  name: 'coinflip',
  usage: '',
  enabled: true,
  /**
   * @param {import('discord.js').Message} message
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Flip a Coin')
      .setDescription('A coin will be flipped in 7 seconds, call heads or tails!')
    const coinflipMessage = await message.reply(embed)

    for (let i = 7; i >= 0; i--) {
      embed.setDescription(`A coin will be flipped in ${i} seconds, call heads or tails`)
      coinflipMessage.edit(embed)
      await new Promise(resolve => setTimeout(resolve, 1250))
    }
    const decision = Math.floor(Math.random() * Math.floor(2))

    embed.setDescription(`The final decision is ${decision === 0 ? '**HEADS**' : '**TAILS**'}`)
    coinflipMessage.edit(embed)
  }
}
