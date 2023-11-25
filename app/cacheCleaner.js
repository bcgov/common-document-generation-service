const config = require('config');
const { readdirSync, realpathSync, rmSync, statSync } = require('fs-extra');
const { tmpdir } = require('os');
const { join } = require('path');

const log = require('./src/components/log')(module.filename);

const RATIO = 0.8; // Best practice is to keep the cache no more than 80% full

const osTempDir = realpathSync(tmpdir());
const cacheDir = (() => {
  if (config.has('carbone.cacheDir')) {
    return realpathSync(config.get('carbone.cacheDir'));
  } else {
    return osTempDir;
  }
})();

const cacheSize = (() => {
  const parseRegex = /^(\d+(?:\.\d+)?) *([kmgtp]?b)$/i;
  const unitMap = {
    b: Math.pow(10, 0),
    kb: Math.pow(10, 3),
    mb: Math.pow(10, 6),
    gb: Math.pow(10, 9),
    tb: Math.pow(10, 12),
    pb: Math.pow(10, 15)
  };

  if (config.has('carbone.cacheSize')) {
    const result = parseRegex.exec(config.get('carbone.cacheSize'));
    if (result && Array.isArray(result)) {
      return parseInt(result[1]) * unitMap[result[2].toLowerCase()];
    }
  } else {
    return null;
  }
})();
const cacheSizeLimit = Math.ceil(cacheSize * RATIO);

log.info(`Cache directory ${cacheDir} with max size of ${cacheSizeLimit}`);

// Short circuit exits
if (!cacheSize) {
  log.info('Maximum cache size not defined - Exiting');
  process.exit(0);
} else if (cacheDir === osTempDir) {
  log.info('Cache points to OS temp directory - Exiting');
  process.exit(0);
}

// Check cache size and prune oldest files away as needed
try {
  const currCacheSize = dirSize(cacheDir);
  const files = getSortedFiles(cacheDir);
  const status = currCacheSize < cacheSizeLimit ? 'below' : 'above';

  log.info(`Current cache size ${currCacheSize} ${status} threshold of ${cacheSizeLimit}`, {
    cacheLimit: cacheSizeLimit,
    cacheSize: currCacheSize
  });

  // Prune files if necessary
  let rmCount = 0;
  for (const file of files) {
    if (dirSize(cacheDir) < cacheSizeLimit) break;
    rmSync(`${cacheDir}/${file}`, { recursive: true, force: true });
    rmCount++;
  }

  log.info(`${rmCount} objects were pruned from the cache - Exiting`, { removeCount: rmCount });
  process.exit(0);
} catch(err) {
  log.error(err.message);
  process.exit(1);
}

/**
 * @function dirSize
 * Recursively calculates the size of directory `dir`
 * @param {string} dir The directory to calculate
 * @returns {number} The size of the directory in bytes
 */
function dirSize(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  const paths = files.map(file => {
    const path = join(dir, file.name);

    if (file.isDirectory()) return dirSize(path);
    if (file.isFile()) {
      const { size } = statSync(path);
      return size;
    }
    return 0;
  });

  return paths.flat(Infinity).reduce((i, size) => i + size, 0);
}

/**
 * @function getSortedFiles
 * Acquires a list of files and directories ordered from oldest to newest modified
 * @param {string} dir The directory to inspect
 * @returns {Array<string>} The list of files and directories in directory `dir`
 */
function getSortedFiles(dir) {
  const files = readdirSync(dir);
  return files
    .map(fileName => ({
      name: fileName,
      time: statSync(`${dir}/${fileName}`).mtime.getTime(),
    }))
    .sort((a, b) => a.time - b.time)
    .map(file => file.name);
}
