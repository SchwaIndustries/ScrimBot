module.exports = exports = {
  name: 'example', // command name
  usage: '<argument>', // arguments for the command
  enabled: false, // whether the command should be loaded
  process: async (message, GLOBALS) => {
    // function called when command is invoked
  }
}
