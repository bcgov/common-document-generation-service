const uuidv4 = require('uuid/v4');

const utils = {
  /** Returns a pretty JSON representation of an object
   *  @param {object} obj A JSON Object
   *  @param {integer} indent Number of spaces to indent
   *  @returns {string} A pretty printed string representation of `obj` with `indent` indentation
   */
  prettyStringify: (obj, indent = 2) => JSON.stringify(obj, null, indent),

  /** From a string representing a filename, get the extension if there is one
   *  @param {filename} string A filename in a string
   *  @returns {string} The extension, ie ".docx", or undefined if there is none
   */
  getFileExtension: filename => {
    const re = /(?:\.([^.]+))?$/;
    return re.exec(filename)[1];
  },

  /** For the DocGen component, determine what the outputted (response) filename should be based
   * on the template object from the request body,
   *  @param {template} obj The template field from the request
   *  @returns {string} The output filename for the response
   */
  determinOutputReportName: template => {
    const extension = template.outputFileType ? template.outputFileType : template.contentFileType;
    const name = template.outputFileName ? template.outputFileName : uuidv4();
    return `${name}.${extension}`;
  }
};

module.exports = utils;

