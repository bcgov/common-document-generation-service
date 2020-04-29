const fs = require('fs-extra');
const log = require('npmlog');
const path = require('path');

const getAllFiles = function(dirPath, fileList) {
  try {
    fileList = fileList || [];

    fs.readdirSync(dirPath).forEach(file => {
      const stat = fs.lstatSync(dirPath + '/' + file);
      if (stat.isDirectory()) {
        fileList = getAllFiles(dirPath + '/' + file, fileList);
      } else {
        fileList.push({path: path.join(dirPath, file), modifiedTs: stat.mtimeMs, size: stat.size});
      }
    });
    return fileList;
  } catch (e) {
    log.error('fileCacheUtils.getAllFiles', e.message);
    return [];
  }
};

const getTotalSize = function(fileList) {
  let totalSize = 0;
  if (fileList && Array.isArray(fileList) && fileList.length) {
    fileList.forEach(function (f) {
      totalSize += f.size;
    });
  }
  return totalSize;
};

const removeOldest = function(fileList, cacheRootDir) {
  if (fileList && Array.isArray(fileList) && fileList.length) {
    // sort by timestamp ascending (oldest first)
    fileList.sort((a, b) => a.modifiedTs - b.modifiedTs);
    const f = fileList[0];
    const dir = path.dirname(f.path);
    if (dir === cacheRootDir) return false; // just in case, we do not want to delete the actual cache dir!
    try{
      fs.removeSync(dir);
      return true;
    } catch (e) {
      log.error('fileCacheUtils.removeOldest', e.message);
      return false;
    }
  }
  return false;
};

module.exports.getAllFiles = getAllFiles;
module.exports.getTotalSize = getTotalSize;
module.exports.removeOldest = removeOldest;
