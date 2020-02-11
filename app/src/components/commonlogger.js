const config = require('config');

const CommonLogger = require('../common-logging/common-logger');
const CommonLoggingHttp = require('../common-logging/common-logging-http');
const CommonLoggingQueue = require('../common-logging/common-logging-queue');
const CommonLoggingStdout = require('../common-logging/common-logging-stdout');

const clogsHttp = new CommonLoggingHttp(config.get('clogs.http'));
const clogsQueue = new CommonLoggingQueue(config.get('clogs.queue'));

const commonlogger = new CommonLogger(clogsHttp, clogsQueue);
const commonloggerStdout = new CommonLoggingStdout();
commonloggerStdout.logger = commonlogger;

module.exports = {commonlogger, commonloggerStdout};
