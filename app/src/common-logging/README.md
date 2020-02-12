# common logging basic overview

Library code to get messages from the application to Common Logging Service (CLOGS) via RESTful API.  
Please note that this library does not write to a file nor to the console, it logs data to CLOGS only.

### common-logger
The main class (CommonLogger) uses a transformer, a queue, and a transport to process logging messages and deliver to the Common Logging Service (CLOGS). 

The flow is:  
1. application writes a message and passes to the common logger.  
2. common logger calls a transformer to turn that message into a Common Logging Service message.  
3. the transformed message is placed into a queue.  
4. common logger intermittently checks the queue and creates a batch
5. batch is passed to transporter
6. transporter sends batch to CLOGS   

### transformer (common-logging-transformer)

| option | description |
| --- | --- |
| env | default environment to include in api log object |
| level | default level for api log objects |
| pattern | default pattern (GROK) for api object message field, api will attempt to parse message field using this pattern (if exists) |
| retention | default retention for api log objects |
| data | additional JSON to add to data field in api log object (only applies if populating data field) |
| metadata | additional JSON to add to api log object (root of api log object) |

#### xform function
Accepts a message (string or JSON), and options (env, level, pattern, retention, parse) that override the transformer defaults.  
The message parameter will be set the api object message field or data field (if message is JSON).  The options can be used to set corresponding api log object fields.  
  
*NOTE*: the parse option is a function that can parse the message parameter and turn it into JSON. In such a case, the api log object data field is set instead of message.  

### queue (common-logging-queue)

| option | description |
| --- | --- |
| batchTimeout | how many milliseconds to wait between batches |
| initialDelay | how many milliseconds to delay initial batch check |
| maxBatchSize | maximum number of items to place in a single API call |

Queue holds items in First In First Out, queue is checked for items every batchTimeout milliseconds, batchSize items are then dequeued and passed to the transporter.  

### transporter (common-logging-http)

| option | description |
| --- | --- |
| tokenUrl | OAuth token url (ex. https://sso-dev.pathfinder.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token) |
| clientId | OAuth client id - service client with CLOGS.LOGGER role |
| clientSecret | OAuth client secret |
| apiUrl | CLOGS API base url (ex. https://clogs-dev.pathfinder.gov.bc.ca) |

Take a batch of messages and deliver to the CLOGS API.  

### common-logging-intercept

Use this to intercept all writes to stdout and stderr and automatically deliver to CommonLogger.  This is not required, but is an easy way to integrate the common logging library.   

## create and initialize

1. Create Transporter
2. Create Queue
2. Create Transformer
4. Create Common Logger
5. Optionally create StdOut Intercept
6. Hook intercept to stdout/stderr

```
const CommonLogger = require('../common-logging/common-logger');
const CommonLoggingHttp = require('../common-logging/common-logging-http');
const CommonLoggingQueue = require('../common-logging/common-logging-queue');
const CommonLoggingStdout = require('../common-logging/common-logging-stdout');
const CommonLoggingTransformer = require('../common-logging/common-logging-xform');

const clogsHttp = new CommonLoggingHttp({'apiUrl': 'CLOGS_HTTP_APIURL', 'clientId': 'CLOGS_HTTP_CLIENTID', 'clientSecret': 'CLOGS_HTTP_CLIENTSECRET', 'tokenUrl': 'CLOGS_HTTP_TOKENURL'});
const clogsQueue = new CommonLoggingQueue({'maxBatchSize': '100', 'batchTimeout': '10000'});
const clogsXform = new CommonLoggingTransformer({'env':'test'});

const commonlogger = new CommonLogger(clogsHttp, clogsQueue);
const commonloggerStdout = new CommonLoggingStdout();
commonloggerStdout.logger = commonlogger;

... 
commonloggerStdout.hook();

commonLogger.log('this is a message that will get sent to CLOGS');

```
