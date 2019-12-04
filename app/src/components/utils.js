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
  }
};

module.exports = utils;

