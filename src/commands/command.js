module.exports = exports = {
    name: 'command', // command name
    usage: '<argument>', // arguments for the command
    enabled: false, // whether the command should be loaded
    process: async (message, GLOBALS) => {
        switch (message.content.split(' ')[1]) {
            case 'enable': enable(message, GLOBALS); break
            case 'disable': disable(message, GLOBALS); break
            case 'debug': debug(message, GLOBALS); break
    }
  }
}