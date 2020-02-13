const axios = require('axios');
const oauth = require('axios-oauth-client');
const tokenProvider = require('axios-token-interceptor');

const Constants = require('./common-logging-constants');

class AuthorizedConnection {
  constructor(options) {
    if (!options || !options.tokenUrl || !options.clientId || !options.clientSecret) {
      throw new Error('AuthorizedConnection is not configured.  Check configuration.');
    }

    this.tokenUrl = options.tokenUrl;

    this.axios = axios.create();
    this.axios.interceptors.request.use(
      // Wraps axios-token-interceptor with oauth-specific configuration,
      // fetches the token using the desired claim method, and caches
      // until the token expires
      oauth.interceptor(tokenProvider, oauth.client(axios.create(), {
        url: this.tokenUrl,
        grant_type: 'client_credentials',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        scope: ''
      }))
    );
  }
}

class CommonLoggingHttp {
  constructor(options) {
    if (!options || !options.tokenUrl || !options.clientId || !options.clientSecret || !options.apiUrl) {
      throw new Error('CommonLoggingHttp is not configured.  Check configuration.');
    }
    this.connection = new AuthorizedConnection(options);
    this.axios = this.connection.axios;
    this.apiUrl = options.apiUrl;
  }

  async xfer(messages) {
    const result = {success: false, status: undefined};
    if (!messages) {
      result.status = Constants.TRANSFER_NO_MESSAGES;
    } else {
      const batch = Array.isArray(messages) ? messages : [messages];

      if (!batch.length) {
        result.status = Constants.TRANSFER_NO_BATCH_ITEMS;
      } else {
        try {
          const response = await this.axios.post(
            `${this.apiUrl}/api/v1/log`,
            batch,
            {
              headers: {
                'Content-Type': 'application/json'
              },
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            }
          );
          result.status = response.status;
          result.success = (Constants.TRANSFER_GOOD_STATUS === result.status);
          if (!result.success) {
            process.stderr.write(`${Constants.COMMON_LOGGING_PREFIX} warn ${result.status} from Common Logging Service\n`);
          }
        } catch (e) {
          const errMsg = e.response ? `${e.response.status} from Common Logging Service. Data : ${JSON.stringify(e.response.data)}` : `Unknown error from Common Logging Service: ${e.message}`;
          process.stderr.write(`${Constants.COMMON_LOGGING_PREFIX} error ${errMsg}\n`);
          result.status = e.response ? e.response.status : Constants.TRANSFER_UNKNOWN_RESPONSE_STATUS;
        }
      }
    }
    return result;
  }
}

module.exports = CommonLoggingHttp;
