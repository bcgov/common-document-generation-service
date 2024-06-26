const config = require('config');
const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const log = require('./log')(module.filename);

class FileCache {
  constructor() {
    this._cachePath = config.has('carbone.cacheDir') ? config.get('carbone.cacheDir') : fs.realpathSync(os.tmpdir());
    // Ensure no trailing path separator
    if (this._cachePath.endsWith(path.sep)) {
      this._cachePath = this._cachePath.slice(0, -1);
    }

    try {
      fs.ensureDirSync(this._cachePath);
    } catch (e) {
      log.error(`Could not access cache directory '${this._cachePath}'.`, { function: 'FileCache constructor', directory: this._cachePath });
      throw new Error(`Could not access cache directory '${this._cachePath}'.`);
    }

    // Private helper functions
    this._getHash = async (file) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(file);
      return new Promise((resolve, reject) => {
        stream.on('readable', () => {
          let chunk;
          while (null !== (chunk = stream.read())) {
            hash.update(chunk);
          }
        });
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', error => reject(error));
      });
    };
    this._getHashPath = hash => `${this._cachePath}${path.sep}${hash}`;
    this._getTempFilePath = () => `${this._cachePath}${path.sep}${uuidv4()}`;
  }

  find(hash) {
    const result = {
      success: false,
      errorType: null,
      errorMsg: null,
      hash: null,
      name: null,
      ext: null,
      dir: null,
      path: null
    };
    if (!hash) {
      result.errorType = 400;
      result.errorMsg = 'Cannot find file; hash parameter is required.';
      return result;
    }

    try {
      const hashPath = this._getHashPath(hash);

      if (!fs.existsSync(hashPath)) {
        result.errorType = 404;
        result.errorMsg = `Hash '${hash}' not found.`;
        return result;
      }
      result.hash = hash;

      const files = fs.readdirSync(hashPath);
      if (!files || files.length !== 1) {
        result.errorType = 404;
        result.errorMsg = 'Hash found; could not read file from cache.';
        return result;
      } else {
        result.name = files[0];
        result.ext = path.extname(result.name).slice(1);
        result.dir = hashPath;
        result.path = `${hashPath}${path.sep}${result.name}`;
        result.success = true;
        return result;
      }
    } catch (e) {
      result.errorType = 500;
      log.error(`Unknown error getting file for hash '${hash}'.`, { function: 'find' });
      result.errorMsg = `Unknown error getting file for hash '${hash}'.`;
      return result;
    }
  }

  read(hash) {
    const file = this.find(hash);
    if (file.success) {
      return fs.readFileSync(file.path);
    } else {
      throw Error(file.errorMsg);
    }
  }

  async move(source, name, options = { overwrite: false }) {
    const result = { success: false, errorType: null, errorMsg: null, hash: null };

    if (!source) {
      result.errorType = 400;
      result.errorMsg = 'Cannot move file; source parameter is required.';
      return result;
    }
    if (!name) {
      result.errorType = 400;
      result.errorMsg = 'Cannot move file; file name parameter is required.';
      return result;
    }

    try {
      // get a hash of the file from contents
      result.hash = await this._getHash(source);
    } catch (e) {
      result.errorType = 500;
      result.errorMsg = `Error creating hash for file '${source}'.`;
      return result;
    }

    const hashPath = this._getHashPath(result.hash);
    // if file exists at temp file path
    if (fs.existsSync(hashPath)) {
      if (options.overwrite) {
        fs.removeSync(hashPath);
      } else {
        // Remove temporary file from cache
        fs.removeSync(source);

        result.errorType = 405;
        result.errorMsg = `File already cached. Hash '${result.hash}'.`;
        return result;
      }
    }

    const dest = `${hashPath}${path.sep}${name}`;
    fs.ensureDirSync(hashPath);
    try {
      fs.moveSync(source, dest, options);
      result.success = fs.existsSync(dest);
    } catch (e) {
      result.errorType = 500;
      result.errorMsg = 'Error moving file to cache.';
    }
    return result;
  }

  remove(hash) {
    const result = { success: false, errorType: null, errorMsg: null };
    const file = this.find(hash);
    if (file.success) {
      fs.removeSync(file.dir);
      result.success = !fs.existsSync(file.dir);
    } else {
      result.errorType = 404;
      result.errorMsg = `Could not remove file. Hash '${hash}', not found.`;
    }
    return result;
  }

  async write(content, fileType, contentEncodingType = 'base64', options = { overwrite: false }) {
    let result = { success: false, errorType: null, errorMsg: null, hash: null };

    if (!content) {
      result.errorType = 400;
      result.errorMsg = 'Cannot write file; content parameter is required.';
      return result;
    }
    if (!fileType) {
      result.errorType = 400;
      result.errorMsg = 'Cannot write file; fileType parameter is required.';
      return result;
    }
    const tmpFile = this._getTempFilePath();
    // save template to temp directory
    await fs.outputFileSync(tmpFile, content, { encoding: contentEncodingType });

    // move temp file to file cache
    let destFilename = path.format({
      name: uuidv4(),
      ext: fileType.replace(/\./g, '')
    });
    result = await this.move(tmpFile, destFilename, options);
    log.info('Template cached', { function: 'fileCache.write' });
    if (!result.success) {
      result.errorMsg = `Error writing content to cache. ${result.errorMsg}`;
    }
    return result;
  }
}

module.exports = FileCache;
