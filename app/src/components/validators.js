const bytes = require('bytes');
const fs = require('fs');
const tmp = require('tmp');
const log = require('npmlog');
const validator = require('validator');

const DEFAULT_ATTACHMENT_SIZE = bytes.parse('5mb');

const models = {
  docGen: {
    /** @function context is required and must be an object */
    context: value => {
      return value && value != null && value.constructor.name === 'Object';
    },
    /** @function template is required and must be an object */
    template: value => {
      return value && value != null && value.constructor.name === 'Object';
    }
  },

  template: {
    /** @function content is required */
    content: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
    },

    /** @function contentEncodingType must be in a set list */
    contentEncodingType: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true }) && validator.isIn(value, ['base64', 'binary', 'hex']);
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
    }
  }
};

const customValidators = {
  docGen: async (obj, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    // validate the doc gen endpoint
    // completely valid object will return an empty array of errors.
    // an invalid object will return a populated array of errors.
    const errors = [];

    if (!models.docGen.context(obj.context)) {
      errors.push({ value: obj.context, message: 'Invalid value `context`.' });
    }
    let validateTemplate = true;
    if (!models.docGen.template(obj.template)) {
      errors.push({ value: obj.template, message: 'Invalid value `template`.' });
      validateTemplate = false;
    }

    if (validateTemplate) {

      let validateSize = true;
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
  }
};

module.exports = { models, customValidators, validatorUtils };
