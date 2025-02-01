# Load testing with K6

[K6](https://k6.io/docs/) is a load testing tool.
Using the K6 command line interface, you can run the scripts found in this directory to test the performance of CDOGS API features.

Note: It is important to not run load tests against production environments. Always check with your server administrators before load testing in a shared server environment.

## Prerequesites

The simple test scripts (for example: [templating.js](templating.js) can be updated with actual values specific to your envionment (for example: your CDOGS api url and authorization token) or could also pass these values using parameters of the K6 command used to trigger the test. See more K6 details on how [Environment Variables](https://k6.io/docs/using-k6/environment-variables/) work.

### Running the tests

```sh
k6 run -e API_PATH=http://cdogs-dev.api.gov.bc.ca/api/v2 -e AUTH_TOKEN=InsertJwtHere templating.js
```

To enable logging, add `--log-output=file=./output.json --log-format=json`. At the moment, the tests currently only log the HTTP response code.

By default, the tests will make 200 evenly-spaced requests within 1 minute. To increase the number of requests the tests will make, add `-e RATE=x` (`x` is a multiplier that gets applied against the rate limit being tested against).

To change the rate limit being tested against, add `-e RATE_LIMIT=300`. By default, this value is `200`.
