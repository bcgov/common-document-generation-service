const path = require('path');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

/**
 * Process and normalize template render options
 * @param {Object} options - The render options from request
 * @param {String} defaultExtension - Default file extension to use
 * @param {Boolean|String} useUuid - If true, use UUID; if string, use as prefix; if false use 'report'
 * @returns {Object} Normalized options object
 */
function processTemplateOptions(options, defaultExtension, useUuid = true) {
  const normalized = options || {};

  // some defaults if options not set...
  if (!normalized.convertTo || !normalized.convertTo.trim().length) {
    // set convert to template type (no conversion)
    normalized.convertTo = defaultExtension;
  }
  if (!normalized.reportName || !normalized.reportName.trim().length) {
    let reportPrefix;
    if (typeof useUuid === 'string') {
      // useUuid is a custom prefix
      reportPrefix = useUuid;
    } else if (useUuid === true) {
      // use UUID
      reportPrefix = uuidv4();
    } else {
      reportPrefix = 'report';
    }
    normalized.reportName = `${reportPrefix}.${normalized.convertTo}`;
  }

  // ensure the reportName has the same extension as the convertTo...
  if (normalized.convertTo !== path.extname(normalized.reportName).slice(1)) {
    normalized.reportName = `${path.parse(normalized.reportName).name}.${normalized.convertTo}`;
  }

  return normalized;
}

/**
 * Set response headers for a rendered document
 * @param {Object} res - Express response object
 * @param {String} reportName - Name of the report file
 * @param {Buffer|String} report - The rendered report data
 */
function setRenderResponseHeaders(res, reportName, report) {
  res.setHeader('Content-Disposition', `attachment; filename=${reportName}`);
  res.setHeader('Content-Transfer-Encoding', 'binary');
  res.setHeader('Content-Type', mime.contentType(path.extname(reportName)));
  res.setHeader('Content-Length', report.length);
  res.setHeader('X-Report-Name', reportName);
}

/**
 * Handle render error response
 * @param {Object} output - The render output containing error info
 * @returns {Object} Error output object
 */
function handleRenderError(output) {
  const errOutput = { detail: output.errorMsg };
  if (output.errorType === 422) {
    errOutput.detail = 'Error in supplied template';
    errOutput.errors = [{ message: output.errorMsg }];
  }
  return errOutput;
}

module.exports = {
  processTemplateOptions,
  setRenderResponseHeaders,
  handleRenderError,
};
