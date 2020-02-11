const axios = require('axios');
const oauth = require('axios-oauth-client');
const tokenProvider = require('axios-token-interceptor');

class AuthorizedConnection {
  constructor(options) {
    if (!options ||(!options.tokenUrl || !options.clientId || !options.clientSecret)) {
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
    if (!options || (!options.tokenUrl || !options.clientId || !options.clientSecret || !options.apiUrl)) {
      throw new Error('CommonLoggingHttp is not configured.  Check configuration.');
    }
    this.connection = new AuthorizedConnection(options);
    this.axios = this.connection.axios;
    this.apiUrl = options.apiUrl;
  }

  async xfer(messages) {
    if (messages) {
      const batch = Array.isArray(messages) ? messages : [messages];

      if (!batch.length) {
        return -2;
      }

      let status;
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
        status = response.status;
      } catch (e) {
        const errMsg = e.response ? `${e.response.status} from Common Logging Service. Data : ${JSON.stringify(e.response.data)}` : `Unknown error from Common Logging Service: ${e.message}`;
        process.stderr.write(`common-logging - error ${errMsg}\n`);
        return e.response ? e.response.status : -3;
      }
      if (201 !== status) {
        process.stderr.write(`common-logging - warn ${status} from Common Logging Service\n`);
      }
      return status;
    }
    return -1;
  }
}

module.exports = CommonLoggingHttp;
