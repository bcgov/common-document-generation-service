const log = require('npmlog');

const docGen = {
  /** TODO: Fill in here...
   *  @param {object} fileName TEMP
   *  @returns {object} A generated document
   */
  generateDocument: async fileName => {
    const generatedDocument = {
      doc: true,
      fileName: fileName
    };
    log.debug('generateDocument', generatedDocument);
    return generatedDocument;
  }
};

module.exports = docGen;
