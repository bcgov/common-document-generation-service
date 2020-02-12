const helper = require('../../common/helper');

const CommonLoggingTransformer = require('../../../src/common-logging/common-logging-transformer');
const Constants = require('../../../src/common-logging/common-logging-constants');
helper.logHelper();

describe('common-logging-transformer constructor', () => {

  test('constructs with defaults', () => {
    const clogsXform = new CommonLoggingTransformer();
    expect(clogsXform).toBeTruthy();
    expect(clogsXform._defaults.env).toBe(Constants.TRANSFORM_DEFAULT_ENV);
  });

  test('constructs with options', () => {
    const clogsXform = new CommonLoggingTransformer({
      env: 'unit-test',
      data: {field: 'value'},
      metadata: {property: 'value!'}
    });
    expect(clogsXform).toBeTruthy();
    expect(clogsXform._defaults.env).toBe('unit-test');
    expect(clogsXform._data.field).toBe('value');
    expect(clogsXform._metadata.property).toBe('value!');
  });

});

describe('common-logging-transformer xform', () => {
  const clogsXform = new CommonLoggingTransformer();

  test('returns undefined with no message', () => {
    const result = clogsXform.xform();
    expect(result).toBe(undefined);
  });

  test('returns message and defaults with no options', () => {
    const result = clogsXform.xform('message is a string');
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.level).toBe(Constants.TRANSFORM_DEFAULT_LEVEL);
    expect(result.retention).toBe(Constants.TRANSFORM_DEFAULT_RETENTION);
    expect(result.env).toBe(Constants.TRANSFORM_DEFAULT_ENV);
  });

  test('returns message and level with options env', () => {
    const result = clogsXform.xform('message is a string', {env: 'unit-test'});
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.env).toBe('unit-test');
  });

  test('returns message and level with options level', () => {
    const result = clogsXform.xform('message is a string', {level: 'error'});
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.level).toBe('error');
  });

  test('returns message and level with options pattern', () => {
    const result = clogsXform.xform('message is a string', {pattern: 'this is not a working pattern'});
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('this is not a working pattern');
  });

  test('returns message and level with options retention', () => {
    const result = clogsXform.xform('message is a string', {retention: 'never'});
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.retention).toBe('never');
  });

  test('returns data when message is json', () => {
    const result = clogsXform.xform({field: 'value'});
    expect(result.message).toBe(undefined);
    expect(result.data.field).toBe('value');
  });

  test('returns data when message can be parsed into json', () => {
    const result = clogsXform.xform('field value', {
      parse: (s) => {
        const parts = s.split(' ');
        const result = {};
        result[parts[0]] = parts[1];
        return result;
      }
    });
    expect(result.message).toBe(undefined);
    expect(result.data.field).toBe('value');
  });

  test('returns message when message cannot be parsed into json', () => {
    const result = clogsXform.xform('field value', {
      // eslint-disable-next-line no-unused-vars
      parse: (s) => {

      }
    });
    expect(result.message).toBe('field value');
    expect(result.data).toBe(undefined);
  });

  test('returns undefined when message is not string or json', () => {
    const result = clogsXform.xform(123456789);
    expect(result).toBe(undefined);
  });


  test('returns with additional data and no metadata', () => {
    const clogsXform = new CommonLoggingTransformer({
      env: 'unit-test',
      data: {field: 'value'},
      metadata: {property: 'value!'}
    });
    const result = clogsXform.xform('this is a message, no data added...');
    expect(result.message).toBe('this is a message, no data added...');
    expect(result.data).toBe(undefined);
    expect(result.metadata).toStrictEqual({property: 'value!'});
  });

  test('returns with additional data and metadata', () => {
    const clogsXform = new CommonLoggingTransformer({
      env: 'unit-test',
      data: {field: 'value'},
      metadata: {property: 'value!'}
    });
    const result = clogsXform.xform({my: 'message'});
    expect(result.message).toBe(undefined);
    expect(result.data).toStrictEqual({my: 'message', field: 'value'});
    expect(result.metadata).toStrictEqual({property: 'value!'});
  });

});
