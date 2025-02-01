import http from 'k6/http';
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';

// -------------------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------------------
// https://k6.io/docs/using-k6/environment-variables

const apiPath = `${__ENV.API_PATH}`;              // include "/api/v2"
const authToken = `${__ENV.AUTH_TOKEN}`;          // exchange token elsewhere, then pass JWT here
const multiplier = parseInt(`${__ENV.RATE}`) ?? 4;    // change multiplier to run test faster
const RATE_LIMIT_PER_MINUTE = parseInt(`${__ENV.RATE_LIMIT}`) ?? 200;

// k6 options (https://k6.io/docs/using-k6/k6-options/)
export const options = {
  scenarios: {
    rateLimitTest: {
      executor: 'constant-arrival-rate',
      rate: RATE_LIMIT_PER_MINUTE * multiplier,   // requests to make per minute
      duration: '1m',                             // duration must be <5m due to JWT expiry
      preAllocatedVUs: 10,
      timeUnit: '1m',
      maxVUs: 100,
    },
  },
};

const url = `${apiPath}/template/render`;

const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};

const body = {
  // Data File for template_information_sharing_agreement.docx from DGRSC
  data: JSON.parse('sample_contexts.json'),
  options: {
    reportName: 'information_sharing_agreement',
    convertTo: 'pdf',
    overwrite: true
  },
  template: {
    // template_information_sharing_agreement.docx from DGRSC
    content: open('sample_template.txt'),
    encodingType: 'base64',
    fileType: 'docx'
  }
}

// run k6
export default function () {

  // make the http request
  const res = http.post(url, JSON.stringify(body), {headers: headers});

  // To enable logging: --log-output=file=./output.json --log-format=json
  console.log(res.status);

  // tests
  // rate limit headers: https://docs.konghq.com/hub/kong-inc/rate-limiting/#headers-sent-to-the-client
  check(res, {
    'is status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'is returning the correct templated response': (r) => r.body == `Hello ${body.data.firstName} ${body.data.lastName}!`,
    'is returning the correct RateLimit-Limit header': (r) => r.headers['Ratelimit-Limit'] == RATE_LIMIT_PER_MINUTE,
    'is returning the correct RateLimit-Remaining header': (r) => r.headers['Ratelimit-Remaining'] < RATE_LIMIT_PER_MINUTE,
    'is returning the correct X-RateLimit-Limit-Minute header': (r) => r.headers['X-Ratelimit-Limit-Minute'] == RATE_LIMIT_PER_MINUTE,
    'is returning the correct X-RateLimit-Remaining-Minute header': (r) => r.headers['X-Ratelimit-Remaining-Minute'] < RATE_LIMIT_PER_MINUTE,
  });

}
