// manually updated dictionary of input/output file types supported by the carbone js library
const fileTypesDictionary = {
  'csv':['doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt', 'csv'],
  'docx':['doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt'],
  'html':['html', 'odt', 'pdf', 'rtf', 'txt'],
  'odt':['doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt'],
  'pptx':['odt', 'pdf'],
  'rtf':['docx','pdf'],
  'txt':['doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt'],
  'xlsx':['odt', 'pdf', 'rtf', 'txt', 'csv', 'xls', 'xlsx']
};

const fileTypes = {  

  /** Returns a list of all supported output file types for the input file 
   * @returns {object[]} An array of result objects
   */
  getFileTypes: () => Promise.all(fileTypesDictionary),

  /** Returns the file types dictionary
    * @returns {object[]} An array of result objects
    */
  fileTypesDictionary: fileTypesDictionary
};

module.exports = fileTypes;
