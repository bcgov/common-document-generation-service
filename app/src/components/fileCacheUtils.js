const fs = require('fs-extra');
const lockFile = require('lockfile');
const log = require('npmlog');
const path = require('path');

const _LOCK_FILE_NAME = 'file-cache.lock';

const getAllFiles = (dirPath, fileList) => {
  try {
    fileList = fileList || [];

    fs.readdirSync(dirPath).forEach(file => {
      const stat = fs.lstatSync(dirPath + path.sep + file);
      if (stat.isDirectory()) {
        fileList = getAllFiles(dirPath + path.sep + file, fileList);
      } else {
        if (file !== _LOCK_FILE_NAME) {
          fileList.push({path: path.join(dirPath, file), modifiedTs: stat.mtimeMs, size: stat.size});
        }
      }
    });
    return fileList;
  } catch (e) {
    log.error('fileCacheUtils.getAllFiles', e.message);
    return [];
  }
};

const getTotalSize = (fileList) => {
  let totalSize = 0;
  if (fileList && Array.isArray(fileList) && fileList.length) {
    fileList.forEach(function (f) {
      totalSize += f.size;
    });
  }
  return totalSize;
};

const removeOldest = (fileList, cacheRootDir) => {
  if (fileList && Array.isArray(fileList) && fileList.length) {
    // sort by timestamp ascending (oldest first)
    fileList.sort((a, b) => a.modifiedTs - b.modifiedTs);
    const f = fileList[0];
    try {
      let p = f.path;
      if (path.dirname(p) !== cacheRootDir) {
        p = path.dirname(p);
      }
      fs.removeSync(p);
      return true;
    } catch (e) {
      log.error('fileCacheUtils.removeOldest', e.message);
      return false;
    }
  }
  return false;
};

const cacheCleanup = (cacheDir, cacheSize, minCacheSize) => {
  const file = path.resolve(cacheDir + path.sep + _LOCK_FILE_NAME);
  return new Promise((resolve, reject) => {
    lockFile.lock(file, {}, function (lockErr) {
      if (lockErr) {
        log.error('fileCacheUtils.cacheCleanup.lock', lockErr);
        reject(lockErr);
      }
      const freeSpace = ((cacheSize * 0.9) - minCacheSize);
      const cacheSpace = Math.max(freeSpace, minCacheSize);
      let storedFiles = getAllFiles(cacheDir);
      let storedSize = getTotalSize(storedFiles);
      while (storedSize >= cacheSpace) {
        // let's start purging...
        if (removeOldest(storedFiles, cacheDir)) {
          storedFiles = getAllFiles(cacheDir);
          storedSize = getTotalSize(storedFiles);
        }
      }
      // unlock...
      lockFile.unlock(file, function (unlockErr) {
        if (unlockErr) {
          log.error('fileCacheUtils.cacheCleanup.unlock', unlockErr);
          reject(unlockErr);
        }
        resolve();
      });
    });
  });

};

module.exports.getAllFiles = getAllFiles;
module.exports.getTotalSize = getTotalSize;
module.exports.cacheCleanup = cacheCleanup;
