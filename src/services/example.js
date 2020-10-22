module.exports = exports = {
  name: 'example', // service name
  enabled: false, // whether the service should be loaded
  /**
   * @param {import('../index.js').GLOBALS} GLOBALS
   */
  process: async (GLOBALS) => {
    // function called when service is invoked
  }
}
