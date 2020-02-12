const helper = require('../../common/helper');

const xform = require('../../../src/common-logging/common-logging-xform');

helper.logHelper();

describe('common-logging-xform', () => {
  test('returns undefined with no message', () => {
    const result = xform();
    expect(result).toBe(undefined);
  });

  test('returns message and defaults with no options', () => {
    const result = xform('message is a string');
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.level).toBe('info');
    expect(result.retention).toBe('default');
  });

  test('returns message and level with options level', () => {
    const result = xform('message is a string', {level: 'error'});
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.level).toBe('error');
    expect(result.retention).toBe('default');
  });

  test('returns message and level with options pattern', () => {
    const result = xform('message is a string', {pattern: 'this is not a working pattern'});
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('this is not a working pattern');
    expect(result.level).toBe('info');
    expect(result.retention).toBe('default');
  });

  test('returns message and level with options retention', () => {
    const result = xform('message is a string', {retention: 'never'});
    expect(result.message).toBe('message is a string');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.level).toBe('info');
    expect(result.retention).toBe('never');
  });

  test('returns data when message is json', () => {
    const result = xform({field: 'value'});
    expect(result.message).toBe(undefined);
    expect(result.data.field).toBe('value');
    expect(result.pattern).toBe('');
    expect(result.level).toBe('info');
    expect(result.retention).toBe('default');
  });

  test('returns data when message can be parsed into json', () => {
    const result = xform('field value', {
      parse: (s) => {
        const parts = s.split(' ');
        const result = {};
        result[parts[0]] = parts[1];
        return result;
      }
    });
    expect(result.message).toBe(undefined);
    expect(result.data.field).toBe('value');
    expect(result.pattern).toBe('');
    expect(result.level).toBe('info');
    expect(result.retention).toBe('default');
  });

  test('returns message when message cannot be parsed into json', () => {
    const result = xform('field value', {
      // eslint-disable-next-line no-unused-vars
      parse: (s) => {

      }
    });
    expect(result.message).toBe('field value');
    expect(result.data).toBe(undefined);
    expect(result.pattern).toBe('');
    expect(result.level).toBe('info');
    expect(result.retention).toBe('default');
  });

  test('returns undefined when message is not string or json', () => {
    const result = xform(123456789);
    expect(result).toBe(undefined);
  });
});
