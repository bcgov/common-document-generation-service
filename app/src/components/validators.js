const bytes = require('bytes');
const fs = require('fs');
const tmp = require('tmp');
const log = require('npmlog');
const validator = require('validator');

const fileTypes = require('../assets/fileTypes.json');
const DEFAULT_ATTACHMENT_SIZE = bytes.parse('5mb');

const models = {
  docGen: {
    /** @function contexts is required and must be an array */
    contexts: value => {
      return value && Array.isArray(value) && value.length;
    },
    /** @function template is required and must be an object */
    template: value => {
      return value && value != null && value.constructor.name === 'Object';
    }
  },

  template: {
    /** @function content is required */
    content: value => {
      return validatorUtils.isNonEmptyString(value);
    },

    /** @function contentEncodingType must be in a set list */
    contentEncodingType: value => {
      if (value) {
        return validatorUtils.isNonEmptyString(value) && validator.isIn(value, ['base64', 'binary', 'hex']);
      }
      return true;
    },

    /** @function contentFileType is required and exists as a valid input file type defined in the fileTypes Dictionary */
    contentFileType: value => {
      return validatorUtils.isNonEmptyString(value) && value in fileTypes;
    },

    /** @function outputFileName is not required, must be a string */
    outputFileName: value => {
      if (value) {
        return validatorUtils.isNonEmptyString(value);
      }
      return true;
    },

    /** @function outputFileType is not required, must be a string */
    outputFileType: value => {
      if (value) {
        return validatorUtils.isNonEmptyString(value);
      }
      return true;
    },

    /** @function size size must be within limit */
    size: async (content, encoding, limit = DEFAULT_ATTACHMENT_SIZE) => {
      if (!(models.template.content(content) && models.template.contentEncodingType(encoding))) {
        return false;
      }

      let attachmentLimit = bytes.parse(limit);
      if (!attachmentLimit || isNaN(attachmentLimit) || attachmentLimit < 1) {
        return false;
      }

      // ok, looks like all incoming parameters are ok, check the size
      // write out temp file, if size is ok then return true...
      let tmpFile = undefined;

      try {
        tmpFile = tmp.fileSync();
        await fs.promises.writeFile(tmpFile.name, Buffer.from(content, encoding));
        // get the written file size
        const stats = fs.statSync(tmpFile.name);
        return stats.size <= attachmentLimit;
      } catch (e) {
        // something wrong (disk i/o?), cannot verify file size
        log.error(`Error validating file size. ${e.message}`);
        return false;
      } finally {
        // delete tmp file
        if (tmpFile) tmpFile.removeCallback();
      }
    },

    /** @function fileConversion input/output file types must exist in fileType conversion dictionary */
    fileConversion: (contentFileType, outputFileType) => {
      if (contentFileType && outputFileType) {
        return fileTypes[contentFileType] && fileTypes[contentFileType].includes(outputFileType);
      }
      return true;
    }

  }
};

const customValidators = {
  docGen: async (obj, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    // validate the doc gen endpoint
    // completely valid object will return an empty array of errors.
    // an invalid object will return a populated array of errors.
    const errors = [];

    if (!models.docGen.contexts(obj.contexts)) {
      errors.push({ value: obj.contexts, message: 'Invalid value `contexts`.' });
    }
    let validateTemplate = true;
    if (!models.docGen.template(obj.template)) {
      errors.push({ value: obj.template, message: 'Invalid value `template`.' });
      validateTemplate = false;
    }

    if (validateTemplate) {

      let validateSize = true;
      if (!models.template.contentFileType(obj.template.contentFileType)) {
        errors.push({ value: obj.template.contentFileType, message: 'Invalid value `template.contentFileType`.' });
        validateSize = false;
      }

      if (!models.template.content(obj.template.content)) {
        errors.push({ value: obj.template.content, message: 'Invalid value `template.content`.' });
        validateSize = false;
      }

      if (!models.template.contentEncodingType(obj.template.contentEncodingType)) {
        errors.push({ value: obj.template.contentEncodingType, message: 'Invalid value `template.contentEncodingType`.' });
        validateSize = false;
      }

      if (validateSize) {
        const validSize = await models.template.size(obj.template.content, obj.template.contentEncodingType, attachmentSizeLimit);
        if (!validSize) {
          errors.push({
            value: 'Template document too large',
            message: `Template exceeds size limit of ${bytes.format(attachmentSizeLimit, 'MB')}.`
          });
        }

      }

      const validConversion = models.template.fileConversion(obj.template.contentFileType, obj.template.outputFileType);
      if (!validConversion) {
        errors.push({
          values: [obj.template.contentFileType, obj.template.outputFileType],
          message: 'Unsupported file type conversion. A dictionary of supported input and output file types can be found at API endpoint \'/fileTypes\''
        });
      }
    }

    return errors;
  }
};

const validatorUtils = {
  /** @function isEmail */
  isEmail: x => {
    return validatorUtils.isString(x) && !validator.isEmpty(x, { ignore_whitespace: true }) && validator.isEmail(x, { allow_display_name: true });
  },

  /** @function isEmailList */
  isEmailList: x => {
    return x && Array.isArray(x) && x.every(v => {
      return validatorUtils.isEmail(v);
    });
  },

  /** @function isInt */
  isInt: x => {
    if (isNaN(x)) {
      return false;
    }
    const num = parseFloat(x);
    // use modulus to determine if it is an int
    return num % 1 === 0;
  },

  /** @function isString */
  isString: x => {
    return Object.prototype.toString.call(x) === '[object String]';
  },

  /** @function isNonEmptyString */
  isNonEmptyString: x => {
    return validatorUtils.isString(x) && !validator.isEmpty(x, { ignore_whitespace: true });
  }
};

module.exports = { models, customValidators, validatorUtils };
