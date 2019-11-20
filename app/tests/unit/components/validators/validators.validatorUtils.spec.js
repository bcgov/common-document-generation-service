
const { validatorUtils } = require('../../../../src/components/validators');

describe('validatorUtils.isEmail', () => {

  it('should return true for email address', () => {
    const result = validatorUtils.isEmail('email@address.com');

    expect(result).toBeTruthy();
  });

  it('should return true for email address with display name', () => {
    const result = validatorUtils.isEmail('Email Address <email@address.com>');

    expect(result).toBeTruthy();
  });

  it('should return false for non-email address value', () => {
    const result = validatorUtils.isEmail('this is not an email');

    expect(result).toBeFalsy();
  });

  it('should return false for empty value', () => {
    const result = validatorUtils.isEmail('');

    expect(result).toBeFalsy();
  });

  it('should return false for whitespace value', () => {
    const result = validatorUtils.isEmail('            ');

    expect(result).toBeFalsy();
  });

  it('should return false for undefined value', () => {
    const result = validatorUtils.isEmail(undefined);

    expect(result).toBeFalsy();
  });

  it('should return false for non-string value', () => {
    const result = validatorUtils.isEmail(123);

    expect(result).toBeFalsy();
  });

});

describe('validatorUtils.isEmailList', () => {

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', 'email2@address2.com'];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses with display names', () => {
    const list = ['Email Address <email@address.com>', 'Email Address II <email2@address2.com>'];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses, some with display names', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return true for an empty array', () => {
    const list = [];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return false for non-array value', () => {
    const result = validatorUtils.isEmailList({ field: 'value' });

    expect(result).toBeFalsy();
  });

  it('should return false for string value', () => {
    const result = validatorUtils.isEmailList('');

    expect(result).toBeFalsy();
  });

  it('should return false for undefined value', () => {
    const result = validatorUtils.isEmailList(undefined);

    expect(result).toBeFalsy();
  });

});

describe('validatorUtils.isInt', () => {

  it('should return true for a int', () => {
    const value = 123;
    const result = validatorUtils.isInt(value);

    expect(result).toBeTruthy();
  });

  it('should return true for a integer as string ', () => {
    const value = '123456';
    const result = validatorUtils.isInt(value);

    expect(result).toBeTruthy();
  });

  it('should return true for a integer as string object ', () => {
    const value = String(123456);
    const result = validatorUtils.isInt(value);

    expect(result).toBeTruthy();
  });

  it('should return false for a non-numeric string ', () => {
    const value = 'abcdefg1234567';
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

  it('should return false for a float ', () => {
    const value = 123.45;
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

  it('should return false for a float string ', () => {
    const value = '123.45';
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

  it('should return false for an array', () => {
    const result = validatorUtils.isInt([{ value: 123 }]);

    expect(result).toBeFalsy();
  });

  it('should return false for a function', () => {
    const value = x => {
      return String(x);
    };
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

});

describe('validatorUtils.isString', () => {

  it('should return true for a string', () => {
    const value = 'this is a string';
    const result = validatorUtils.isString(value);

    expect(result).toBeTruthy();
  });

  it('should return true for a string object ', () => {
    const value = String(123456);
    const result = validatorUtils.isString(value);

    expect(result).toBeTruthy();
  });

  it('should return false for a number ', () => {
    const value = 123456;
    const result = validatorUtils.isString(value);

    expect(result).toBeFalsy();
  });

  it('should return false for a non-string object ', () => {
    const result = validatorUtils.isString({ value: 'string' });

    expect(result).toBeFalsy();
  });

  it('should return false for an array', () => {
    const result = validatorUtils.isString([{ value: 'string' }]);

    expect(result).toBeFalsy();
  });

  it('should return false for a function', () => {
    const value = x => {
      return String(x);
    };
    const result = validatorUtils.isString(value);

    expect(result).toBeFalsy();
  });

});
