const bytes = require('bytes');
const config = require('config');
const fs = require('fs-extra');
const multer = require('multer');
const os = require('os');
const Problem = require('api-problem');

const fileUploadsDir = config.get('carbone.cacheDir');
const formFieldName = config.get('carbone.formFieldName');
const maxFileSize = bytes.parse(config.get('carbone.uploadSize'));
const maxFileCount = parseInt(config.get('carbone.uploadCount'));

let storage = undefined;
let uploader = undefined;

function init() {
  try {
    fs.ensureDirSync(fileUploadsDir);
  } catch (e) {
    console.warn(`Unable to use directory "${fileUploadsDir}". Falling back to default OS temp directory`);
    fs.realpathSync(os.tmpdir());
  }

  if (!storage) {
    storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, fileUploadsDir);
      }
    });
  }

  // setup the multer
  if (!uploader) {
    if (maxFileCount > 1) {
      uploader = multer({
        storage: storage,
        limits: { fileSize: maxFileSize, files: maxFileCount }
      }).array(formFieldName);
    } else {
      // in case maxFileCount is negative, hard set to 1
      uploader = multer({
        storage: storage,
        limits: { fileSize: maxFileSize, files: 1 }
      }).single(formFieldName);
    }
  }
}

init();

module.exports = {
  upload(req, res, next) {
    if (!uploader) {
      return next(new Problem(500, 'File Upload middleware has not been configured.'));
    }
    uploader(req, res, (err) => {
      // detect multer errors, send back nicer through the middleware stack...
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            next(new Problem(400, 'Upload file error', { detail: `Upload file size is limited to ${maxFileSize} bytes` }));
            break;
          case 'LIMIT_FILE_COUNT':
            next(new Problem(400, 'Upload file error', { detail: `Upload is limited to ${maxFileCount} files` }));
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            next(new Problem(400, 'Upload file error', { detail: 'Upload encountered an unexpected file' }));
            break;
          // we don't expect that we will encounter these in our api/app, but here for completeness
          case 'LIMIT_PART_COUNT':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: upload form has too many parts' }));
            break;
          case 'LIMIT_FIELD_KEY':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: upload field name for the files is too long' }));
            break;
          case 'LIMIT_FIELD_VALUE':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: upload field is too long' }));
            break;
          case 'LIMIT_FIELD_COUNT':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: too many fields' }));
            break;
          default:
            next(new Problem(400, 'Upload file error', { detail: `Upload failed with the following error: ${err.message}` }));
        }
      } else if (err) {
        next(new Problem(400, 'Unknown upload file error', { detail: err.message }));
      } else {
        next();
      }
    });
  }
};
