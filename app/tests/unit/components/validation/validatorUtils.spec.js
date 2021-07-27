
const { validatorUtils } = require('../../../../src/components/validation');

describe('isInt', () => {
  it('should return true for a int', () => {
    expect(validatorUtils.isInt(123)).toBeTruthy();
  });

  it('should return true for a integer as string', () => {
    expect(validatorUtils.isInt('123456')).toBeTruthy();
  });

  it('should return true for a integer as string object', () => {
    expect(validatorUtils.isInt(123456)).toBeTruthy();
  });

  it('should return false for a non-numeric string', () => {
    expect(validatorUtils.isInt('abcdefg1234567')).toBeFalsy();
  });

  it('should return false for a float', () => {
    expect(validatorUtils.isInt(123.45)).toBeFalsy();
  });

  it('should return false for a float string', () => {
    expect(validatorUtils.isInt('123.45')).toBeFalsy();
  });

  it('should return false for an array', () => {
    expect(validatorUtils.isInt([{ value: 123 }])).toBeFalsy();
  });

  it('should return false for a function', () => {
    expect(validatorUtils.isInt((x) => String(x))).toBeFalsy();
  });
});

describe('isString', () => {
  it('should return true for a string', () => {
    expect(validatorUtils.isString('this is a string')).toBeTruthy();
  });

  it('should return true for a string object', () => {
    expect(validatorUtils.isString(String(123456))).toBeTruthy();
  });

  it('should return false for a number ', () => {
    expect(validatorUtils.isString(123456)).toBeFalsy();
  });

  it('should return false for a non-string object', () => {
    expect(validatorUtils.isString({ value: 'string' })).toBeFalsy();
  });

  it('should return false for an array', () => {
    expect(validatorUtils.isString([{ value: 'string' }])).toBeFalsy();
  });

  it('should return false for a function', () => {
    expect(validatorUtils.isString((x) => String(x))).toBeFalsy();
  });
});

describe('isNonEmptyString', () => {
  it('should return true for a non-empty string', () => {
    expect(validatorUtils.isNonEmptyString('this is a string')).toBeTruthy();
  });

  it('should return true for a string object', () => {
    expect(validatorUtils.isNonEmptyString(String(123456))).toBeTruthy();
  });

  it('should return false for an empty string', () => {
    expect(validatorUtils.isNonEmptyString('')).toBeFalsy();
  });

  it('should return false for a whitespace string', () => {
    expect(validatorUtils.isNonEmptyString('   ')).toBeFalsy();
  });

  it('should return false for undefined', () => {
    expect(validatorUtils.isNonEmptyString(undefined)).toBeFalsy();
  });

  it('should return false for null', () => {
    expect(validatorUtils.isNonEmptyString(null)).toBeFalsy();
  });

  it('should return false for empty String object', () => {
    expect(validatorUtils.isNonEmptyString(String('  '))).toBeFalsy();
  });
});

describe('isObject', () => {
  it('should return false for a non-object', () => {
    expect(validatorUtils.isObject('foo')).toBeFalsy();
  });

  it('should return false for null', () => {
    expect(validatorUtils.isObject(null)).toBeFalsy();
  });

  it('should return false for undefined', () => {
    expect(validatorUtils.isObject(undefined)).toBeFalsy();
  });

  it('should return true for objects', () => {
    expect(validatorUtils.isObject({})).toBeTruthy();
  });
});
