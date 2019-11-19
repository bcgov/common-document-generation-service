const log = require('npmlog');

const checks = {
  /** TODO: Need this? Rethink Checks stuff...
   * Could try to connect to WIndward if we use that
   * Checks the connectivity of something...
   *  @returns A result object
  */
  getGeneratorStatus: async () => {
    try {
      return true;
    // eslint-disable-next-line no-unreachable
    } catch (error) {
      log.error('getGeneratorStatus', error.message);
      return false;
    }
  },

  /** Returns a list of all endpoint connectivity states
   * @returns {object[]} An array of result objects
   */
  getStatus: () => Promise.all([
    checks.getGeneratorStatus()
  ])
};

module.exports = checks;
