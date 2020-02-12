const config = require('config');

const CommonLogger = require('../common-logging/common-logger');
const CommonLoggingHttp = require('../common-logging/common-logging-http');
const CommonLoggingQueue = require('../common-logging/common-logging-queue');
const CommonLoggingStdout = require('../common-logging/common-logging-stdout');
const CommonLoggingTransformer = require('../common-logging/common-logging-transformer');

const clogsHttp = new CommonLoggingHttp({
  tokenUrl: config.get('cmnsrv.tokenUrl'),
  clientId: config.get('cmnsrv.clientId'),
  clientSecret: config.get('cmnsrv.clientSecret'),
  apiUrl: config.get('clogs.http.apiUrl')
});
const clogsQueue = new CommonLoggingQueue({
  maxBatchSize: config.get('clogs.queue.maxBatchSize'),
  batchTimeout: config.get('clogs.queue.batchTimeout'),
  initialDelay: config.get('clogs.queue.initialDelay')
});
const clogsXform = new CommonLoggingTransformer({
  env: config.get('clogs.metadata.env')
});

const commonlogger = new CommonLogger(clogsHttp, clogsQueue, clogsXform);
const commonloggerStdout = new CommonLoggingStdout();
commonloggerStdout.logger = commonlogger;

module.exports = {commonlogger, commonloggerStdout};
