const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const log = require('./log')(module.filename);
const utils = require('./utils');

async function asyncRender(carbone, template, data, options) {
  const maybePromise = carbone.render(template, data, options);
  if (maybePromise && typeof maybePromise.then === 'function') {
    return maybePromise;
  }

  return new Promise((resolve, reject) => {
    carbone.render(template, data, options, (err, report, reportName) => {
      if (err) {
        return reject(err);
      }
      return resolve({ report, reportName });
    });
  });
}

async function render(carbone, template, data = {}, options = {}, formatters = {}) {
  const result = {
    success: false,
    errorType: null,
    errorMsg: null,
    reportName: null,
    report: null
  };

  if (!template) {
    result.errorType = 400;
    result.errorMsg = 'Template not specified.';
    return result;
  }

  if (!fs.existsSync(template)) {
    result.errorType = 404;
    result.errorMsg = 'Template not found.';
    return result;
  }

  if (!options.convertTo || !options.convertTo.trim()) {
    options.convertTo = path.extname(template).slice(1);
  }
  if (!options.reportName || !options.reportName.trim()) {
    options.reportName = `${uuidv4()}.${options.convertTo}`;
  }
  if (options.convertTo !== path.extname(options.reportName).slice(1)) {
    options.reportName = `${path.parse(options.reportName).name}.${options.convertTo}`;
  }

  let savedFormatters = null;
  if (Object.keys(formatters).length && typeof carbone.addFormatters === 'function') {
    savedFormatters = Object.assign({}, carbone.formatters || {});
    carbone.formatters = Object.assign({}, carbone.formatters || {}, formatters);
  } else if (Object.keys(formatters).length) {
    options.formatters = formatters;
  }

  try {
    const renderResult = await asyncRender(carbone, template, data, options);
    result.report = renderResult.report;
    result.reportName = renderResult.reportName || options.reportName;
    result.success = true;
  } catch (e) {
    result.errorType = utils.determineCarboneErrorCode(e);
    result.errorMsg = `Could not render template. ${e}`;
    log.warn('Could not render template', { function: 'render', error: e });
  } finally {
    if (savedFormatters && typeof carbone.addFormatters === 'function') {
      carbone.formatters = savedFormatters;
    }
  }

  return result;
}

module.exports = {
  render
};
