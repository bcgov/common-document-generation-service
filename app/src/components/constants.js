const fileTypes = Object.freeze({
  csv: ['csv', 'doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt'],
  docx: ['doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt'],
  html: ['html', 'odt', 'pdf', 'rtf', 'txt'],
  ods: ['csv', 'ods', 'pdf', 'txt', 'xls', 'xlsx'],
  odt: ['doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt'],
  pptx: ['odt', 'pdf', 'ppt', 'pptx'],
  rtf: ['docx', 'pdf'],
  txt: ['doc', 'docx', 'html', 'odt', 'pdf', 'rtf', 'txt'],
  xlsx: ['csv', 'ods', 'pdf', 'rtf', 'txt', 'xls', 'xlsx'],
});

module.exports = {
  fileTypes: fileTypes,
};
